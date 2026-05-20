package com.skinclinic.domain.procedure.review.entity;

import com.skinclinic.domain.procedure.review.dto.ProcedureReviewResponse;
import com.skinclinic.domain.skin.recommendation.enumtype.ProcedureType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "procedure_review")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProcedureReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Long procedureRecordId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ProcedureType procedureType;

    @Column(nullable = false, length = 100)
    private String procedureName;

    @Column(nullable = false)
    private LocalDate treatedAt;

    @Column(nullable = false)
    private int rating;

    @Column(nullable = false, length = 300)
    private String shortComment;

    private Integer effectSatisfaction;

    private Integer priceSatisfaction;

    private Integer consultationSatisfaction;

    private Integer revisitIntention;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public ProcedureReview(
            Long userId,
            Long procedureRecordId,
            ProcedureType procedureType,
            String procedureName,
            LocalDate treatedAt,
            int rating,
            String shortComment,
            Integer effectSatisfaction,
            Integer priceSatisfaction,
            Integer consultationSatisfaction,
            Integer revisitIntention
    ) {
        this.userId = userId;
        this.procedureRecordId = procedureRecordId;
        this.procedureType = procedureType;
        this.procedureName = procedureName;
        this.treatedAt = treatedAt;
        this.rating = rating;
        this.shortComment = shortComment;
        this.effectSatisfaction = effectSatisfaction;
        this.priceSatisfaction = priceSatisfaction;
        this.consultationSatisfaction = consultationSatisfaction;
        this.revisitIntention = revisitIntention;
        this.createdAt = LocalDateTime.now();
    }

    public ProcedureReviewResponse toResponse() {
        return new ProcedureReviewResponse(
                id,
                userId,
                procedureRecordId,
                procedureType.name(),
                procedureName,
                treatedAt,
                rating,
                shortComment,
                effectSatisfaction,
                priceSatisfaction,
                consultationSatisfaction,
                revisitIntention,
                createdAt
        );
    }
}
