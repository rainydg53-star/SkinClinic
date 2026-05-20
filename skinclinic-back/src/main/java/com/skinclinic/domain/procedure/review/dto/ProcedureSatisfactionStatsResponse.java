package com.skinclinic.domain.procedure.review.dto;

import java.time.LocalDateTime;
import java.util.List;

public record ProcedureSatisfactionStatsResponse(
        LocalDateTime generatedAt,
        long totalReviewCount,
        ProcedureReviewStatItemResponse highestRatedProcedure,
        ProcedureReviewStatItemResponse lowestRatedProcedure,
        List<ProcedureReviewStatItemResponse> procedureStats
) {
}
