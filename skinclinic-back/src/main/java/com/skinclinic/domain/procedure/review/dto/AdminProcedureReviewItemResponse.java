package com.skinclinic.domain.procedure.review.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record AdminProcedureReviewItemResponse(
        Long id,
        Long userId,
        String memberName,
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
