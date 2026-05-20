package com.skinclinic.domain.procedure.review.repository;

import com.skinclinic.domain.procedure.review.entity.ProcedureReview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProcedureReviewRepository extends JpaRepository<ProcedureReview, Long> {
    List<ProcedureReview> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<ProcedureReview> findAllByOrderByCreatedAtDesc();

    boolean existsByProcedureRecordId(Long procedureRecordId);
}
