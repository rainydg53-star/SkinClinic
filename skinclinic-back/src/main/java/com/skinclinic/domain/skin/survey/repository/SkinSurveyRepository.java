package com.skinclinic.domain.skin.survey.repository;

import com.skinclinic.domain.skin.survey.entity.SkinSurvey;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SkinSurveyRepository extends JpaRepository<SkinSurvey, Long> {

    Optional<SkinSurvey> findTopByUserIdOrderByIdDesc(Long userId);

    Page<SkinSurvey> findByUserIdOrderByIdDesc(Long userId, Pageable pageable);
}
