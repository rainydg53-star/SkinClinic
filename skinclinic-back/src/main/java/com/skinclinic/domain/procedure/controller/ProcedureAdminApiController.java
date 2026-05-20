package com.skinclinic.domain.procedure.controller;

import com.skinclinic.domain.procedure.dto.ProcedureAdminListResponseDto;
import com.skinclinic.domain.procedure.dto.ProcedureCategoryCreateRequestDto;
import com.skinclinic.domain.procedure.dto.ProcedureCategoryResponseDto;
import com.skinclinic.domain.procedure.dto.ProcedureCreateRequestDto;
import com.skinclinic.domain.procedure.dto.ProcedureDetailResponseDto;
import com.skinclinic.domain.procedure.service.ProcedureService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/procedures")
public class ProcedureAdminApiController {

    private final ProcedureService procedureService;

    @GetMapping
    public ResponseEntity<List<ProcedureAdminListResponseDto>> getAdminProcedureList() {
        return ResponseEntity.ok(procedureService.getAdminProcedureList());
    }

    @GetMapping("/categories")
    public ResponseEntity<List<ProcedureCategoryResponseDto>> getAdminProcedureCategories() {
        return ResponseEntity.ok(procedureService.getAdminProcedureCategories());
    }

    @PostMapping("/categories")
    public ResponseEntity<ProcedureCategoryResponseDto> createProcedureCategory(
            @Valid @RequestBody ProcedureCategoryCreateRequestDto dto
    ) {
        return ResponseEntity.ok(procedureService.createProcedureCategory(dto.getName()));
    }

    @DeleteMapping("/categories/{categoryId}")
    public ResponseEntity<?> deleteProcedureCategory(@PathVariable Long categoryId) {
        procedureService.deleteProcedureCategory(categoryId);
        return ResponseEntity.ok(Map.of("message", "카테고리를 삭제했습니다."));
    }

    @PostMapping
    public ResponseEntity<?> createProcedure(@Valid @ModelAttribute ProcedureCreateRequestDto dto) {
        Long procedureId = procedureService.createProcedure(dto);
        return ResponseEntity.ok(Map.of(
                "message", "시술이 등록되었습니다.",
                "procedureId", procedureId
        ));
    }

    @GetMapping("/{procedureId}")
    public ResponseEntity<ProcedureDetailResponseDto> getAdminProcedureDetail(@PathVariable Long procedureId) {
        return ResponseEntity.ok(procedureService.getAdminProcedureDetail(procedureId));
    }

    @PutMapping("/{procedureId}")
    public ResponseEntity<?> updateProcedure(@PathVariable Long procedureId,
                                             @Valid @ModelAttribute ProcedureCreateRequestDto dto) {
        procedureService.updateProcedure(procedureId, dto);
        return ResponseEntity.ok(Map.of("message", "시술이 수정되었습니다."));
    }

    @DeleteMapping("/{procedureId}")
    public ResponseEntity<?> deleteProcedure(@PathVariable Long procedureId) {
        procedureService.deleteProcedure(procedureId);
        return ResponseEntity.ok(Map.of("message", "시술이 삭제되었습니다."));
    }
}
