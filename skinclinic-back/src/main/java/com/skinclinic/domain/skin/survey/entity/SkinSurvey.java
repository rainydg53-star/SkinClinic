package com.skinclinic.domain.skin.survey.entity;

import com.skinclinic.domain.skin.survey.enumtype.SkinArea;
import com.skinclinic.domain.skin.survey.enumtype.SkinConcern;
import com.skinclinic.domain.skin.survey.enumtype.SkinType;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.*;

@Entity
@Table(name = "skin_survey")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SkinSurvey {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 추가: 이 설문을 작성한 사용자의 ID
    @Column(name = "user_id")
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "skin_type", nullable = false)
    private SkinType skinType;

    @ElementCollection
    @CollectionTable(
            name = "skin_survey_concern",
            joinColumns = @JoinColumn(name = "skin_survey_id")
    )
    @Enumerated(EnumType.STRING)
    @Column(name = "concern")
    private Set<SkinConcern> concerns = new HashSet<>();

    @ElementCollection
    @CollectionTable(
            name = "skin_survey_area",
            joinColumns = @JoinColumn(name = "skin_survey_id")
    )
    @Enumerated(EnumType.STRING)
    @Column(name = "area")
    private Set<SkinArea> skinAreas = new LinkedHashSet<>();


    @ElementCollection
    @CollectionTable(
            name = "skin_survey_answer",
            joinColumns = @JoinColumn(name = "skin_survey_id")
    )
    @MapKeyColumn(name = "question_code")
    @Column(name = "answer_code")
    private Map<String, String> questionAnswers = new LinkedHashMap<>();

    @Builder
    public SkinSurvey(
            Long userId,
            SkinType skinType,
            Set<SkinConcern> concerns,
            Set<SkinArea> skinAreas,
            Map<String, String> questionAnswers
    ){
        this.userId = userId;
        this.skinType = skinType;
        this.concerns = concerns != null ? concerns : new HashSet<>();
        this.skinAreas = skinAreas != null ? skinAreas : new LinkedHashSet<>();
        this.questionAnswers = questionAnswers != null ? questionAnswers : new LinkedHashMap<>();
    }
}
