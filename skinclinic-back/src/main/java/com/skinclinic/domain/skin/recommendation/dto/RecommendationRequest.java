package com.skinclinic.domain.skin.recommendation.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationRequest {

    @NotNull(message = "surveyId는 필수 입니다.")
    private Long surveyId;
    // 프론트가 보내는 id 저장용.
}
