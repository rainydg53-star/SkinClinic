package com.skinclinic.domain.skin.recommendation.entity;

import com.skinclinic.domain.skin.survey.entity.SkinSurvey;
import com.skinclinic.domain.skin.survey.enumtype.SkinConcern;
import com.skinclinic.domain.skin.survey.enumtype.SkinType;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "recommendation_history")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RecommendationHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // pk값을 db가 자동 생성
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false) // 필요할 때만 가져온다, fetch 사용하면 optional로 제한
    // RecommendationHistory를 조회했을때 여기에 있는 컬럼을 전부 조회하지 않고 딱 히스토리의 날짜와 제목만 가져온다.
    // 설문지 내용은 사용자가 클릭해서 '상세 보기'로 들어갈 때만 가져오면 되니까 FetchType.LAZY 사용.
    // optional = false 이 값은 절대 비어있을(null) 수 없다.
    @JoinColumn(name = "skin_survey_id", nullable = false) // FK는 skin_survey_id, null이면 안됨.
    private SkinSurvey survey;
    // 추천 이력 여러개가 하나의 설문에 속할 수 있으니까 다대일

    @Enumerated(EnumType.STRING)
    @Column(name = "skin_type", nullable = false, length = 30)
    private SkinType skinType; // 피부 타입

    @ElementCollection(fetch = FetchType.LAZY)  // 엔티티가 아니라, 그냥 값들의 묶음(고민 내용 자체가 고유 ID를 가질 필요는 없음)
    @CollectionTable(
            name = "recommendation_history_concern",
            joinColumns = @JoinColumn(name = "recommendation_history_id")
    ) // 컬렉션이 저장될 별도 테이블 recommendation_history_concern 지정
    // 테이블의 concerns 컬럼 한 칸에 ["여드름", "모공", "잡티"]를 다 때려 넣을 수가 없어서 별도의 테이블을 하나 더 만들어서 저장.
    @Enumerated(EnumType.STRING)
    @Column(name = "concern", nullable = false, length = 30)
    private Set<SkinConcern> concerns = new LinkedHashSet<>();  // 피부 고민 여러개
    // 중복방지 Set 사용 -> LinkedHashSet으로 입력 순서 유지 + 중복 제거


    @OneToMany(mappedBy = "history", cascade = CascadeType.ALL, orphanRemoval = true)  // 추천 이력 1개 : 추천 시술 여러개
    @OrderBy("score DESC, id ASC") // 점수 높은 순, 같으면 id 오름차순
    private List<RecommendationProcedure> procedures = new ArrayList<>(); // 시술목록 들

    @Column(name = "created_at", nullable = false, updatable = false) // 생성 후 변경 불가
    private LocalDateTime createdAt;

    // 핵심 포인트 : 생성자 대신 빌더 패턴 사용 (선택 사항이지만 추천)
    @Builder
    public RecommendationHistory(SkinSurvey survey, SkinType skinType, Set<SkinConcern> concerns) {
        this.survey = survey; // 설문
        this.skinType = skinType;  // 피부타입
        this.concerns = concerns != null ? concerns : new LinkedHashSet<>(); // 고민목록이 null이면 빈 Set생성
    }

    @PrePersist  // 엔티티가 처음 저장되기 직전에 실행되는 JPA 라이프사이클 메서드, createdAt를 자동으로 넣기 위해서
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // 핵심 포인트 : 연관관계 편의 메서드 (기존 로직 유지) 양방향 연관관계는 양쪽을 다 맞춰줘야 함.
    public void addProcedure(RecommendationProcedure procedure) {
        this.procedures.add(procedure);
        // 현재 객체(this)의 'procedures' 리스트에 파라미터로 받은 'procedure'를 추가

        procedure.assignHistory(this);
        // 파라미터로 받은 'procedure' 객체 내부의 history 필드에 현재 객체(this)를 저장
    }
}
