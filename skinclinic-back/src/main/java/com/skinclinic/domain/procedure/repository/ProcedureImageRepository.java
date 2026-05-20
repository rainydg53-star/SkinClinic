package com.skinclinic.domain.procedure.repository;

import com.skinclinic.domain.procedure.entity.ProcedureImage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProcedureImageRepository extends JpaRepository<ProcedureImage,Long> {
}
