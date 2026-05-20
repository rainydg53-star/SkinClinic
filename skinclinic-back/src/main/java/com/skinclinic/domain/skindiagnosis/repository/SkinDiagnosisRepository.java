package com.skinclinic.domain.skindiagnosis.repository;

import com.skinclinic.domain.skindiagnosis.entity.SkinDiagnosis;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SkinDiagnosisRepository extends JpaRepository<SkinDiagnosis, Long> {

    @EntityGraph(attributePaths = "regions")
    List<SkinDiagnosis> findByMemberIdOrderByCreatedAtDesc(Long memberId);

    @EntityGraph(attributePaths = "regions")
    Optional<SkinDiagnosis> findByIdAndMemberId(Long id, Long memberId);

    @EntityGraph(attributePaths = "regions")
    List<SkinDiagnosis> findAllByOrderByCreatedAtDesc();
}

