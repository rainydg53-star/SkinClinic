package com.skinclinic.domain.skin.recommendation.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcedureRecommendationDto {
    // 추천 시술 1개 정보 응답용 DTO (추천 목록안에 들어가는 개별)
    private String procedureCode; // 시술 고유 코드
    private String procedureName; // 시술명
    private String description; // 시술 상세 설명
    private int score;  // 추천 점수
    private List<String> reasons; // 추천 근거(이유) 목록
}
