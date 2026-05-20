package com.skinclinic.domain.procedure.controller;

import com.skinclinic.domain.procedure.dto.ProcedureListResponseDto;
import com.skinclinic.domain.procedure.service.ProcedureService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.skinclinic.domain.procedure.dto.ProcedureDetailResponseDto;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/procedures")
public class ProcedureApiController {

    private final ProcedureService procedureService;

    @GetMapping
    public ResponseEntity<List<ProcedureListResponseDto>> getProcedureList() {
        return ResponseEntity.ok(procedureService.getProcedureList());
    }
    @GetMapping("/{procedureId}")
    public ResponseEntity<ProcedureDetailResponseDto> getProcedureDetail(@PathVariable Long procedureId) {
        return ResponseEntity.ok(procedureService.getProcedureDetail(procedureId));
    }
}