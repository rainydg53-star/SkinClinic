package com.skinclinic.domain.procedure.repository;

import com.skinclinic.domain.procedure.entity.ProcedureCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProcedureCategoryRepository extends JpaRepository<ProcedureCategory, Long> {
    Optional<ProcedureCategory> findByName(String name);
    boolean existsByName(String name);
    List<ProcedureCategory> findAllByOrderByNameAsc();
}
