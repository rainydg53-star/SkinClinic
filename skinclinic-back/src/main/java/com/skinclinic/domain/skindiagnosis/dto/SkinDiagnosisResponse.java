package com.skinclinic.domain.skindiagnosis.dto;

import com.skinclinic.domain.skindiagnosis.entity.SkinDiagnosis;
import com.skinclinic.domain.skindiagnosis.entity.SkinDiagnosisRegion;
import java.time.LocalDateTime;
import java.util.List;

public record SkinDiagnosisResponse(
        Long diagnosisId,
        Long memberId,
        String source,
        String skinTypeResult,
        String mainConcern,
        String overallComment,
        List<RegionConditionResponse> regions,
        LocalDateTime createdAt
) {
    public static SkinDiagnosisResponse from(SkinDiagnosis diagnosis) {
        List<RegionConditionResponse> regionResponses = diagnosis.getRegions().stream()
                .map(RegionConditionResponse::from)
                .toList();
        return new SkinDiagnosisResponse(
                diagnosis.getId(),
                diagnosis.getMemberId(),
                diagnosis.getSource(),
                diagnosis.getSkinTypeResult(),
                diagnosis.getMainConcern(),
                diagnosis.getOverallComment(),
                regionResponses,
                diagnosis.getCreatedAt()
        );
    }

    public record RegionConditionResponse(String region, String conditionText) {
        static RegionConditionResponse from(SkinDiagnosisRegion region) {
            return new RegionConditionResponse(region.getRegion(), region.getConditionText());
        }
    }
}

