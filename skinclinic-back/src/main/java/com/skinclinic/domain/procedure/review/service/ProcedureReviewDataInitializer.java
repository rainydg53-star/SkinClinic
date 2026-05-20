package com.skinclinic.domain.procedure.review.service;

import com.skinclinic.domain.procedure.review.entity.ProcedureRecord;
import com.skinclinic.domain.procedure.review.entity.ProcedureReviewMember;
import com.skinclinic.domain.procedure.review.repository.ProcedureRecordRepository;
import com.skinclinic.domain.procedure.review.repository.ProcedureReviewMemberRepository;
import com.skinclinic.domain.skin.recommendation.enumtype.ProcedureType;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ProcedureReviewDataInitializer {

    private final ProcedureReviewMemberRepository procedureReviewMemberRepository;
    private final ProcedureRecordRepository procedureRecordRepository;

    @PostConstruct
    void init() {
        if (procedureReviewMemberRepository.count() == 0) {
            procedureReviewMemberRepository.saveAll(List.of(
                    new ProcedureReviewMember(1L, "김민지", "010-3089-4791"),
                    new ProcedureReviewMember(2L, "이서연", "010-2222-2222"),
                    new ProcedureReviewMember(3L, "박지훈", "010-3333-3333")
            ));
        }

        if (procedureRecordRepository.count() == 0) {
            procedureRecordRepository.saveAll(List.of(
                    new ProcedureRecord(1001L, 1L, ProcedureType.BRIGHTENING_CARE, ProcedureType.BRIGHTENING_CARE.getLabel(), LocalDate.of(2026, 2, 20), true),
                    new ProcedureRecord(1002L, 1L, ProcedureType.LIFTING_FIRMING_CARE, ProcedureType.LIFTING_FIRMING_CARE.getLabel(), LocalDate.of(2026, 1, 11), true),
                    new ProcedureRecord(1003L, 1L, ProcedureType.SOOTHING_CARE, ProcedureType.SOOTHING_CARE.getLabel(), LocalDate.of(2026, 3, 1), true),
                    new ProcedureRecord(2001L, 2L, ProcedureType.BRIGHTENING_CARE, ProcedureType.BRIGHTENING_CARE.getLabel(), LocalDate.of(2026, 2, 8), true),
                    new ProcedureRecord(2002L, 2L, ProcedureType.HYDRATION_CARE, ProcedureType.HYDRATION_CARE.getLabel(), LocalDate.of(2026, 2, 28), true),
                    new ProcedureRecord(3001L, 3L, ProcedureType.LIFTING_FIRMING_CARE, ProcedureType.LIFTING_FIRMING_CARE.getLabel(), LocalDate.of(2026, 1, 30), true)
            ));
        }
    }
}
