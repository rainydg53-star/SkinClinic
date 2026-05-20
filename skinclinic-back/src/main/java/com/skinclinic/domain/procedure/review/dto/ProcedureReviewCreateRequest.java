package com.skinclinic.domain.procedure.review.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ProcedureReviewCreateRequest(
        @NotNull Long userId,
        @NotNull Long procedureRecordId,
        @Min(1) @Max(5) int rating,
        @NotBlank String shortComment,
        @Min(1) @Max(5) Integer effectSatisfaction,
        @Min(1) @Max(5) Integer priceSatisfaction,
        @Min(1) @Max(5) Integer consultationSatisfaction,
        @Min(1) @Max(5) Integer revisitIntention
) {
}
