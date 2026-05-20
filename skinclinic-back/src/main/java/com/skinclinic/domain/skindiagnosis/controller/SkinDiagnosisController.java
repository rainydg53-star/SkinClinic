package com.skinclinic.domain.skindiagnosis.controller;

import com.skinclinic.domain.member.service.MemberService;
import com.skinclinic.domain.skindiagnosis.dto.SkinDiagnosisCreateRequest;
import com.skinclinic.domain.skindiagnosis.dto.SkinDiagnosisResponse;
import com.skinclinic.domain.skindiagnosis.dto.SkinPhotoAnalysisResponse;
import com.skinclinic.domain.skindiagnosis.service.SkinDiagnosisService;
import com.skinclinic.domain.skindiagnosis.service.SkinPhotoAnalysisService;
import com.skinclinic.global.auth.CustomUserDetails;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/skin-diagnoses")
public class SkinDiagnosisController {

    private final SkinDiagnosisService skinDiagnosisService;
    private final SkinPhotoAnalysisService skinPhotoAnalysisService;
    private final MemberService memberService;

    public SkinDiagnosisController(
            SkinDiagnosisService skinDiagnosisService,
            SkinPhotoAnalysisService skinPhotoAnalysisService,
            MemberService memberService
    ) {
        this.skinDiagnosisService = skinDiagnosisService;
        this.skinPhotoAnalysisService = skinPhotoAnalysisService;
        this.memberService = memberService;
    }

    @PostMapping
    public SkinDiagnosisResponse create(
            @Valid @RequestBody SkinDiagnosisCreateRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long memberId = request.memberId();
        if (userDetails != null) {
            memberId = memberService.getMyInfo(userDetails.getUsername()).getId();
        }
        SkinDiagnosisCreateRequest normalized = new SkinDiagnosisCreateRequest(
                memberId,
                request.source(),
                request.skinTypeResult(),
                request.mainConcern(),
                request.overallComment(),
                request.regions()
        );
        return SkinDiagnosisResponse.from(skinDiagnosisService.create(normalized));
    }

    @GetMapping("/me")
    public List<SkinDiagnosisResponse> myDiagnoses(
            @RequestParam(required = false) Long memberId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long resolvedMemberId = resolveMemberId(memberId, userDetails);
        return skinDiagnosisService.getMyDiagnoses(resolvedMemberId).stream()
                .map(SkinDiagnosisResponse::from)
                .toList();
    }

    @GetMapping("/me/{id}")
    public SkinDiagnosisResponse myDiagnosisDetail(
            @PathVariable Long id,
            @RequestParam(required = false) Long memberId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long resolvedMemberId = resolveMemberId(memberId, userDetails);
        return SkinDiagnosisResponse.from(skinDiagnosisService.getMyDiagnosisDetail(resolvedMemberId, id));
    }

    @PostMapping("/analyze-photo")
    public SkinPhotoAnalysisResponse analyzePhoto(@RequestParam("file") MultipartFile file) {
        return skinPhotoAnalysisService.analyze(file);
    }

    private Long resolveMemberId(Long memberId, CustomUserDetails userDetails) {
        if (userDetails != null) {
            return memberService.getMyInfo(userDetails.getUsername()).getId();
        }
        if (memberId == null) {
            throw new IllegalArgumentException("memberId가 필요합니다.");
        }
        return memberId;
    }
}

