package com.skinclinic.domain.procedure.review.repository;

import com.skinclinic.domain.procedure.review.entity.ProcedureRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProcedureRecordRepository extends JpaRepository<ProcedureRecord, Long> {
    List<ProcedureRecord> findByUserIdAndCompletedTrueOrderByTreatedAtDesc(Long userId);
}
