package com.skinclinic.domain.procedure.repository;

import com.skinclinic.domain.procedure.entity.Procedure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ProcedureRepository extends JpaRepository<Procedure, Long> {
    List<Procedure> findByVisibleTrueAndDeletedFalseOrderByIdDesc();

    List<Procedure> findByDeletedFalseOrderByIdDesc();

    java.util.Optional<Procedure> findByIdAndDeletedFalse(Long id);

    @Query("select distinct p.category from Procedure p where p.deleted = false and p.category is not null and trim(p.category) <> ''")
    List<String> findDistinctCategories();
}
