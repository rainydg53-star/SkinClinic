package com.skinclinic.domain.procedure.service;

import com.skinclinic.domain.procedure.dto.ProcedureAdminListResponseDto;
import com.skinclinic.domain.procedure.dto.ProcedureCategoryResponseDto;
import com.skinclinic.domain.procedure.dto.ProcedureCreateRequestDto;
import com.skinclinic.domain.procedure.dto.ProcedureDetailResponseDto;
import com.skinclinic.domain.procedure.dto.ProcedureListResponseDto;
import com.skinclinic.domain.procedure.entity.Procedure;
import com.skinclinic.domain.procedure.entity.ProcedureCategory;
import com.skinclinic.domain.procedure.entity.ProcedureImage;
import com.skinclinic.domain.procedure.repository.ProcedureCategoryRepository;
import com.skinclinic.domain.procedure.repository.ProcedureRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProcedureService {

    private final ProcedureRepository procedureRepository;
    private final ProcedureCategoryRepository procedureCategoryRepository;

    @Value("${itemImgLocation}")
    private String itemImgLocation;

    public List<ProcedureListResponseDto> getProcedureList() {
        return procedureRepository.findByVisibleTrueAndDeletedFalseOrderByIdDesc()
                .stream()
                .map(ProcedureListResponseDto::from)
                .toList();
    }

    public ProcedureDetailResponseDto getProcedureDetail(Long procedureId) {
        Procedure procedure = procedureRepository.findByIdAndDeletedFalse(procedureId)
                .orElseThrow(() -> new IllegalArgumentException("시술 정보를 찾을 수 없습니다."));

        if (!procedure.isVisible()) {
            throw new IllegalArgumentException("공개되지 않은 시술입니다.");
        }

        return ProcedureDetailResponseDto.from(procedure);
    }

    public List<ProcedureAdminListResponseDto> getAdminProcedureList() {
        return procedureRepository.findByDeletedFalseOrderByIdDesc()
                .stream()
                .map(ProcedureAdminListResponseDto::from)
                .toList();
    }

    @Transactional
    public List<ProcedureCategoryResponseDto> getAdminProcedureCategories() {
        initializeCategoriesIfEmpty();

        return procedureCategoryRepository.findAllByOrderByNameAsc()
                .stream()
                .map(ProcedureCategoryResponseDto::from)
                .toList();
    }

    @Transactional
    public ProcedureCategoryResponseDto createProcedureCategory(String categoryName) {
        String normalizedCategoryName = normalizeCategoryName(categoryName);

        if (procedureCategoryRepository.existsByName(normalizedCategoryName)) {
            throw new IllegalArgumentException("이미 존재하는 카테고리입니다.");
        }

        ProcedureCategory procedureCategory = procedureCategoryRepository.save(
                new ProcedureCategory(normalizedCategoryName)
        );

        return ProcedureCategoryResponseDto.from(procedureCategory);
    }

    @Transactional
    public void deleteProcedureCategory(Long categoryId) {
        ProcedureCategory procedureCategory = procedureCategoryRepository.findById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("삭제할 카테고리를 찾을 수 없습니다."));

        procedureCategoryRepository.delete(procedureCategory);
    }

    @Transactional
    public Long createProcedure(ProcedureCreateRequestDto dto) {
        validateDetailImages(dto.getDetailImages());

        String normalizedCategory = normalizeCategoryName(dto.getCategory());
        saveCategoryIfMissing(normalizedCategory);

        String thumbnailUrl = saveImage(dto.getThumbnailImage());

        Procedure procedure = Procedure.builder()
                .name(dto.getName())
                .summary(dto.getSummary())
                .description(dto.getDescription())
                .price(dto.getPrice())
                .imageUrl(thumbnailUrl)
                .category(normalizedCategory)
                .visible(dto.isVisible())
                .build();

        addDetailImages(procedure, dto.getDetailImages());

        procedureRepository.save(procedure);
        return procedure.getId();
    }

    @Transactional(readOnly = true)
    public ProcedureDetailResponseDto getAdminProcedureDetail(Long procedureId) {
        Procedure procedure = procedureRepository.findByIdAndDeletedFalse(procedureId)
                .orElseThrow(() -> new IllegalArgumentException("시술 정보를 찾을 수 없습니다."));

        return ProcedureDetailResponseDto.from(procedure);
    }

    @Transactional
    public void updateProcedure(Long procedureId, ProcedureCreateRequestDto dto) {
        validateDetailImages(dto.getDetailImages());

        String normalizedCategory = normalizeCategoryName(dto.getCategory());
        saveCategoryIfMissing(normalizedCategory);

        Procedure procedure = procedureRepository.findByIdAndDeletedFalse(procedureId)
                .orElseThrow(() -> new IllegalArgumentException("시술 정보를 찾을 수 없습니다."));

        procedure.setName(dto.getName());
        procedure.setSummary(dto.getSummary());
        procedure.setDescription(dto.getDescription());
        procedure.setPrice(dto.getPrice());
        procedure.setCategory(normalizedCategory);
        procedure.setVisible(dto.isVisible());

        if (dto.getThumbnailImage() != null && !dto.getThumbnailImage().isEmpty()) {
            deletePhysicalFile(procedure.getImageUrl());
            String thumbnailUrl = saveImage(dto.getThumbnailImage());
            procedure.setImageUrl(thumbnailUrl);
        }

        if (dto.getDetailImages() != null && !dto.getDetailImages().isEmpty()) {
            for (ProcedureImage detailImage : procedure.getDetailImages()) {
                deletePhysicalFile(detailImage.getImageUrl());
            }

            procedure.clearDetailImages();
            addDetailImages(procedure, dto.getDetailImages());
        }
    }

    @Transactional
    public void deleteProcedure(Long procedureId) {
        Procedure procedure = procedureRepository.findByIdAndDeletedFalse(procedureId)
                .orElseThrow(() -> new IllegalArgumentException("시술 정보를 찾을 수 없습니다."));
        procedure.softDelete();
    }

    private void validateDetailImages(List<MultipartFile> detailImages) {
        if (detailImages == null) {
            return;
        }

        long validImageCount = detailImages.stream()
                .filter(file -> file != null && !file.isEmpty())
                .count();

        if (validImageCount > 5) {
            throw new IllegalArgumentException("상세 이미지는 최대 5개까지 업로드할 수 있습니다.");
        }
    }

    private void addDetailImages(Procedure procedure, List<MultipartFile> detailImages) {
        if (detailImages == null || detailImages.isEmpty()) {
            return;
        }

        int sortOrder = 1;
        for (MultipartFile file : detailImages) {
            if (file == null || file.isEmpty()) {
                continue;
            }

            String imageUrl = saveImage(file);
            procedure.addDetailImage(new ProcedureImage(imageUrl, sortOrder));
            sortOrder++;
        }
    }

    private String saveImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        try {
            File uploadDir = new File(itemImgLocation);
            if (!uploadDir.exists()) {
                uploadDir.mkdirs();
            }

            String originalFilename = file.getOriginalFilename();
            String ext = StringUtils.getFilenameExtension(originalFilename);
            String savedFileName = UUID.randomUUID() + "." + ext;

            File savedFile = new File(uploadDir, savedFileName);
            file.transferTo(savedFile);

            return "/images/" + savedFileName;
        } catch (IOException e) {
            throw new RuntimeException("이미지 저장에 실패했습니다.");
        }
    }

    private void deletePhysicalFile(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return;
        }

        String fileName = imageUrl.replace("/images/", "");
        File file = new File(itemImgLocation, fileName);

        if (file.exists()) {
            file.delete();
        }
    }

    private void initializeCategoriesIfEmpty() {
        if (procedureCategoryRepository.count() > 0) {
            return;
        }

        procedureRepository.findDistinctCategories().stream()
                .map(this::normalizeCategoryName)
                .forEach(this::saveCategoryIfMissing);
    }

    private void saveCategoryIfMissing(String categoryName) {
        if (!procedureCategoryRepository.existsByName(categoryName)) {
            procedureCategoryRepository.save(new ProcedureCategory(categoryName));
        }
    }

    private String normalizeCategoryName(String categoryName) {
        if (categoryName == null || categoryName.isBlank()) {
            throw new IllegalArgumentException("카테고리명은 비워둘 수 없습니다.");
        }

        return categoryName.trim();
    }

}
