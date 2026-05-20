package com.skinclinic.domain.skin.recommendation.controller;

import com.skinclinic.domain.skin.recommendation.dto.RecommendationRequest;
import com.skinclinic.domain.skin.recommendation.dto.RecommendationResponse;
import com.skinclinic.domain.skin.recommendation.service.RecommendationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;

    // 추천 생성(저장)
    @PostMapping
    public ResponseEntity<RecommendationResponse> createRecommendation( @Valid @RequestBody RecommendationRequest request ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(recommendationService.createRecommendation(request));
    }

    // 추천 단건 조회(페이징 불필요)
    @GetMapping("/{recommendationId}")
    public ResponseEntity<RecommendationResponse> getRecommendation( @PathVariable Long recommendationId) {
        return ResponseEntity.ok(recommendationService.getRecommendation(recommendationId));
    }

    // 설문 기준 이력 조회 (관리자용에서 사용)
    // 추후 필요하면 관리자 페이지에서 검색창으로 surveyId 입력해서 조회 같은 기능
    @GetMapping("/survey/{surveyId}")
    public ResponseEntity<Page<RecommendationResponse>> getRecommendationHistories(
            @PathVariable Long surveyId,
            @PageableDefault(size = 5, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(recommendationService.getRecommendationHistories(surveyId, pageable));
    }

    // 전체 추천 이력 조회
    @GetMapping
    public ResponseEntity<Page<RecommendationResponse>> getAllRecommendations(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(recommendationService.getAllRecommendations(pageable));
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<Page<RecommendationResponse>> getRecommendationHistoriesByUser(
            @PathVariable Long userId,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(recommendationService.getRecommendationHistoriesByUser(userId, pageable));
    }

}
