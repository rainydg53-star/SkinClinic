package com.skinclinic.domain.skindiagnosis.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Getter
@Entity
@Table(name = "skin_diagnoses")
public class SkinDiagnosis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(nullable = false, length = 20)
    private String source;

    @Column(name = "skin_type_result", length = 30)
    private String skinTypeResult;

    @Column(name = "main_concern", length = 30)
    private String mainConcern;

    @Column(name = "overall_comment", columnDefinition = "TEXT")
    private String overallComment;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "diagnosis", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<SkinDiagnosisRegion> regions = new ArrayList<>();

    protected SkinDiagnosis() {
    }

    public static SkinDiagnosis create(
            Long memberId,
            String source,
            String skinTypeResult,
            String mainConcern,
            String overallComment
    ) {
        SkinDiagnosis diagnosis = new SkinDiagnosis();
        diagnosis.memberId = memberId;
        diagnosis.source = source != null ? source : "SURVEY";
        diagnosis.skinTypeResult = skinTypeResult;
        diagnosis.mainConcern = mainConcern;
        diagnosis.overallComment = overallComment;
        return diagnosis;
    }

    public void addRegion(String region, String conditionText) {
        SkinDiagnosisRegion regionEntity = new SkinDiagnosisRegion(this, region, conditionText);
        regions.add(regionEntity);
    }
}

