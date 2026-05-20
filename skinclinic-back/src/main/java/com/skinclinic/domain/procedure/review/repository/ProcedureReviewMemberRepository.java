package com.skinclinic.domain.procedure.review.repository;

import com.skinclinic.domain.procedure.review.entity.ProcedureReviewMember;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProcedureReviewMemberRepository extends JpaRepository<ProcedureReviewMember, Long> {
}
