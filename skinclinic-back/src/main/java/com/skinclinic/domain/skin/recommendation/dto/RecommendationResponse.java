package com.skinclinic.domain.skin.recommendation.dto;


import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecommendationResponse {
// 추천 결과 전체 응답 DTO

    private Long recommendationId; // 결과 조회용 id
    private Long surveyId; // 설문(원본) 번호

    private String skinTypeCode; // 피부 타입 코드

    private List<String> concernCodes; // 피부 고민 코드 리스트

    private Map<String, String> questionAnswers;  // 설문 추가

    private List<ProcedureRecommendationDto> recommendations; // 추천된 시술 목록(시술명, 점수, 이유)

    private LocalDateTime createdAt; // 추천 결과 생성 일시(저장된 날짜 및 시간)

}
