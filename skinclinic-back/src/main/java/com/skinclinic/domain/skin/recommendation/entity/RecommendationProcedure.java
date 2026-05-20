package com.skinclinic.domain.skin.recommendation.entity;

import com.skinclinic.domain.skin.recommendation.enumtype.ProcedureType;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "recommendation_procedure")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RecommendationProcedure {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recommendation_history_id", nullable = false)
    private RecommendationHistory history;

    @Enumerated(EnumType.STRING)
    @Column(name = "procedure_type", nullable = false, length = 50)
    private ProcedureType procedureType;

    @Column(name = "score", nullable = false)
    private int score;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
            name = "recommendation_procedure_reason",
            joinColumns = @JoinColumn(name = "recommendation_procedure_id")
    )
    @Column(name = "reason", nullable = false, length = 200)
    private Set<String> reasons = new LinkedHashSet<>();

    @Builder
    public RecommendationProcedure(ProcedureType procedureType, int score, Set<String> reasons) {
        this.procedureType = procedureType;
        this.score = score;
        this.reasons = (reasons != null) ? new LinkedHashSet<>(reasons) : new LinkedHashSet<>();
    }

    void assignHistory(RecommendationHistory history){
        this.history = history;
    }

}
