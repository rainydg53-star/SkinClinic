package com.skinclinic.domain.skin.survey.dto;

import com.skinclinic.domain.skin.survey.entity.SkinSurvey;
import com.skinclinic.domain.skin.survey.enumtype.SkinConcern;
import com.skinclinic.domain.skin.survey.enumtype.SkinType;
import com.skinclinic.domain.skin.survey.enumtype.SkinArea;
import lombok.Builder;
import lombok.Getter;

import java.util.Map;
import java.util.Set;

@Getter
@Builder
public class SkinSurveyResponse {
    // 저장 후 fronted 로 돌려줄 응답 DTO임.

    private Long id;
    private SkinType skinType;
    private Set<SkinConcern> concerns;
    private Set<SkinArea> skinAreas;
    private Map<String, String> questionAnswers;

    public static SkinSurveyResponse from(SkinSurvey skinSurvey){
        // SkinSurvey를 받아서 SkinSurveyResponse를 반환하는 from 메서드 생성.
        return SkinSurveyResponse.builder()
                .id(skinSurvey.getId())
                .skinType(skinSurvey.getSkinType())
                .concerns(skinSurvey.getConcerns())
                .skinAreas(skinSurvey.getSkinAreas())
                .questionAnswers(skinSurvey.getQuestionAnswers())
                .build();
    }
}
