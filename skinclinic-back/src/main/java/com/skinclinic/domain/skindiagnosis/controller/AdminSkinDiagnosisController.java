package com.skinclinic.domain.skindiagnosis.controller;

import com.skinclinic.domain.skindiagnosis.dto.SkinDiagnosisResponse;
import com.skinclinic.domain.skindiagnosis.service.SkinDiagnosisService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/skin-diagnoses")
public class AdminSkinDiagnosisController {

    private final SkinDiagnosisService skinDiagnosisService;

    public AdminSkinDiagnosisController(SkinDiagnosisService skinDiagnosisService) {
        this.skinDiagnosisService = skinDiagnosisService;
    }

    @GetMapping
    public List<SkinDiagnosisResponse> list(@RequestParam(required = false) Long memberId) {
        if (memberId != null) {
            return skinDiagnosisService.getDiagnosesByMember(memberId).stream()
                    .map(SkinDiagnosisResponse::from)
                    .toList();
        }
        return skinDiagnosisService.getAllDiagnoses().stream()
                .map(SkinDiagnosisResponse::from)
                .toList();
    }

    @GetMapping("/{id}")
    public SkinDiagnosisResponse detail(@PathVariable Long id) {
        return SkinDiagnosisResponse.from(skinDiagnosisService.getDiagnosisDetail(id));
    }
}

