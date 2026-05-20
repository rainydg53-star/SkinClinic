package com.skinclinic.domain.skin.survey.dto;

import com.skinclinic.domain.skin.survey.enumtype.SkinArea;
import com.skinclinic.domain.skin.survey.enumtype.SkinConcern;
import com.skinclinic.domain.skin.survey.enumtype.SkinType;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Map;
import java.util.Set;

@Getter
@NoArgsConstructor
public class SkinSurveyRequest {
    // fronted에서 보내는 요청 값.
    // 피부타입1개, 고민 여러개 받기

    private SkinType skinType;
    private Set<SkinConcern> concerns;
    private Set<SkinArea> skinAreas;  // 부위 추가
    private Map<String, String> questionAnswers; // 설문 추가
}
