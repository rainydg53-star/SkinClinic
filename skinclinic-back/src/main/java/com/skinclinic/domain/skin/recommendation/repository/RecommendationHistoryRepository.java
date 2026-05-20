package com.skinclinic.domain.skin.recommendation.repository;

import com.skinclinic.domain.skin.recommendation.entity.RecommendationHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RecommendationHistoryRepository extends JpaRepository<RecommendationHistory, Long> {

    // 1. 특정 설문의 이력 (설문지의 고유 번호로)
    Page<RecommendationHistory> findBySurveyIdOrderByCreatedAtDesc(Long surveyId, Pageable pageable);

    // 2. 전체 조회
    Page<RecommendationHistory> findAllByOrderByCreatedAtDesc(Pageable pageable);

    // 3. 특정 사용자의 추천 이력
    Page<RecommendationHistory> findBySurveyUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
  // findByUserIdOrderByCreatedAtDesc 이거 바꿈.
}
