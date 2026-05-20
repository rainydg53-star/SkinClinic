package com.skinclinic.domain.treatmentrecord.service;

import com.skinclinic.domain.member.entity.Member;
import com.skinclinic.domain.member.repository.MemberRepository;
import com.skinclinic.domain.payment.entity.Payment;
import com.skinclinic.domain.payment.repository.PaymentRepository;
import com.skinclinic.domain.procedure.entity.Procedure;
import com.skinclinic.domain.procedure.repository.ProcedureRepository;
import com.skinclinic.domain.reservation.entity.ReservationStatus;
import com.skinclinic.domain.reservation.repository.ReservationRepository;
import com.skinclinic.domain.treatmentrecord.dto.TreatmentRecordCreateRequestDto;
import com.skinclinic.domain.treatmentrecord.dto.TreatmentRecordDetailResponseDto;
import com.skinclinic.domain.treatmentrecord.dto.TreatmentRecordListResponseDto;
import com.skinclinic.domain.treatmentrecord.dto.TreatmentRecordMemberPageResponseDto;
import com.skinclinic.domain.treatmentrecord.dto.TreatmentRecordMemberSummaryResponseDto;
import com.skinclinic.domain.treatmentrecord.entity.TreatmentRecord;
import com.skinclinic.domain.treatmentrecord.repository.TreatmentRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class TreatmentRecordService {

    private final TreatmentRecordRepository treatmentRecordRepository;
    private final MemberRepository memberRepository;
    private final PaymentRepository paymentRepository;
    private final ProcedureRepository procedureRepository;
    private final ReservationRepository reservationRepository;

    @Value("${itemImgLocation}")
    private String itemImgLocation;

    public Long createTreatmentRecord(TreatmentRecordCreateRequestDto dto) {
        Member member = memberRepository.findById(dto.getMemberId())
                .orElseThrow(() -> new IllegalArgumentException("회원 정보를 찾을 수 없습니다."));

        Procedure procedure = procedureRepository.findById(dto.getProcedureId())
                .orElseThrow(() -> new IllegalArgumentException("시술 정보를 찾을 수 없습니다."));

        Payment payment = null;
        if (dto.getPaymentId() != null) {
            payment = paymentRepository.findById(dto.getPaymentId())
                    .orElseThrow(() -> new IllegalArgumentException("결제 정보를 찾을 수 없습니다."));
        }

        String beforeImageUrl = saveImage(dto.getBeforeImage());
        String afterImageUrl = saveImage(dto.getAfterImage());

        TreatmentRecord treatmentRecord = TreatmentRecord.builder()
                .member(member)
                .procedure(procedure)
                .payment(payment)
                .procedureName(procedure.getName())
                .treatmentDate(dto.getTreatmentDate())
                .notes(dto.getNotes())
                .beforeImageUrl(beforeImageUrl)
                .afterImageUrl(afterImageUrl)
                .createdAt(LocalDateTime.now())
                .build();

        treatmentRecordRepository.save(treatmentRecord);
        reservationRepository
                .findTopByMember_IdAndProcedure_IdAndStatusInOrderByCreatedAtDesc(
                        member.getId(),
                        procedure.getId(),
                        List.of(ReservationStatus.PENDING, ReservationStatus.CONFIRMED)
                )
                .ifPresent(reservation -> {
                    if (reservation.getStatus() != ReservationStatus.COMPLETED) {
                        reservation.markCompleted();
                    }
                });
        return treatmentRecord.getId();
    }

    @Transactional(readOnly = true)
    public List<TreatmentRecordListResponseDto> getMyTreatmentRecords(String loginId) {
        return treatmentRecordRepository.findByMember_LoginIdOrderByTreatmentDateDescIdDesc(loginId)
                .stream()
                .map(TreatmentRecordListResponseDto::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public TreatmentRecordDetailResponseDto getMyTreatmentRecordDetail(String loginId, Long treatmentRecordId) {
        TreatmentRecord treatmentRecord = treatmentRecordRepository
                .findByIdAndMember_LoginId(treatmentRecordId, loginId)
                .orElseThrow(() -> new IllegalArgumentException("시술 기록을 찾을 수 없습니다."));

        return TreatmentRecordDetailResponseDto.from(treatmentRecord);
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

    @Transactional(readOnly = true)
    public List<TreatmentRecordListResponseDto> getMemberTreatmentRecords(Long memberId) {
        return treatmentRecordRepository.findByMember_IdOrderByTreatmentDateDescIdDesc(memberId)
                .stream()
                .map(TreatmentRecordListResponseDto::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public TreatmentRecordMemberPageResponseDto getTreatmentRecordMembers(String keyword, int page, int size, String sort) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.max(size, 1);
        String sortOrder = "asc".equalsIgnoreCase(sort) ? "asc" : "desc";

        Page<TreatmentRecordMemberSummaryResponseDto> result = treatmentRecordRepository
                .findMemberSummariesByKeyword(
                        keyword == null ? "" : keyword.trim(),
                        sortOrder,
                        PageRequest.of(safePage, safeSize))
                .map(projection -> {
                    TreatmentRecord latestRecord = treatmentRecordRepository
                            .findTopByMember_IdOrderByTreatmentDateDescIdDesc(projection.getMemberId())
                            .orElse(null);

                    return TreatmentRecordMemberSummaryResponseDto.from(
                            projection,
                            latestRecord == null ? null : latestRecord.getId(),
                            latestRecord == null ? null : latestRecord.getProcedureName()
                    );
                });

        return TreatmentRecordMemberPageResponseDto.builder()
                .content(result.getContent())
                .page(result.getNumber())
                .size(result.getSize())
                .totalPages(result.getTotalPages())
                .totalElements(result.getTotalElements())
                .build();
    }

    @Transactional(readOnly = true)
    public TreatmentRecordDetailResponseDto getMemberTreatmentRecordDetail(Long memberId, Long treatmentRecordId) {
        TreatmentRecord treatmentRecord = treatmentRecordRepository.findByIdAndMember_Id(treatmentRecordId, memberId)
                .orElseThrow(() -> new IllegalArgumentException("시술 기록을 찾을 수 없습니다."));

        return TreatmentRecordDetailResponseDto.from(treatmentRecord);
    }

    public void deleteMemberTreatmentRecord(Long memberId, Long treatmentRecordId) {
        TreatmentRecord treatmentRecord = treatmentRecordRepository.findByIdAndMember_Id(treatmentRecordId, memberId)
                .orElseThrow(() -> new IllegalArgumentException("시술 기록을 찾을 수 없습니다."));

        deleteImageIfExists(treatmentRecord.getBeforeImageUrl());
        deleteImageIfExists(treatmentRecord.getAfterImageUrl());
        treatmentRecordRepository.delete(treatmentRecord);
    }

    private void deleteImageIfExists(String imageUrl) {
        if (!StringUtils.hasText(imageUrl)) {
            return;
        }

        String normalizedPath = imageUrl.startsWith("/images/") ? imageUrl.substring("/images/".length()) : imageUrl;
        File imageFile = new File(itemImgLocation, normalizedPath);
        if (imageFile.exists()) {
            imageFile.delete();
        }
    }

}
