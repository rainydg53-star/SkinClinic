package com.skinclinic.domain.procedure.review.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record ProcedureReviewResponse(
        Long id,
        Long userId,
        Long procedureRecordId,
        String procedureType,
        String procedureName,
        LocalDate treatedAt,
        int rating,
        String shortComment,
        Integer effectSatisfaction,
        Integer priceSatisfaction,
        Integer consultationSatisfaction,
        Integer revisitIntention,
        LocalDateTime createdAt
) {
}
