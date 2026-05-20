package com.skinclinic.domain.procedure.review.dto;

public record ProcedureReviewStatItemResponse(
        String procedureType,
        String procedureName,
        long reviewCount,
        double averageRating,
        double averageEffectSatisfaction,
        double averagePriceSatisfaction,
        double averageConsultationSatisfaction,
        double averageRevisitIntention
) {
}
