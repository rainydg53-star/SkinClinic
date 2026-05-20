package com.skinclinic.domain.skindiagnosis.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public record SkinDiagnosisCreateRequest(
        @NotNull Long memberId,
        String source,
        String skinTypeResult,
        String mainConcern,
        String overallComment,
        List<RegionCondition> regions
) {
    public record RegionCondition(String region, String conditionText) {
    }
}

