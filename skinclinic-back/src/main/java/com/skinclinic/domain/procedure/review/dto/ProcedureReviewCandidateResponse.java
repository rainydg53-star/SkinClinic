package com.skinclinic.domain.procedure.review.dto;

import java.time.LocalDate;

public record ProcedureReviewCandidateResponse(
        Long procedureRecordId,
        Long userId,
        String procedureType,
        String procedureName,
        LocalDate treatedAt,
        boolean reviewed
) {
}
