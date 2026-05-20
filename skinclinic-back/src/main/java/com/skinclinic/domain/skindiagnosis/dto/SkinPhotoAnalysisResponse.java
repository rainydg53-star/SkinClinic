package com.skinclinic.domain.skindiagnosis.dto;

import java.util.List;

public record SkinPhotoAnalysisResponse(
        boolean success,
        boolean fallbackUsed,
        String message,
        List<RegionResult> regions
) {
    public record RegionResult(
            String region,
            boolean trouble,
            String level,
            double score
    ) {
    }
}

