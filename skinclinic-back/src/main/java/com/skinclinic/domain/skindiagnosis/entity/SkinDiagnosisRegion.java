package com.skinclinic.domain.skindiagnosis.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;

@Getter
@Entity
@Table(name = "skin_diagnosis_regions")
public class SkinDiagnosisRegion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "diagnosis_id", nullable = false)
    private SkinDiagnosis diagnosis;

    @Column(nullable = false, length = 20)
    private String region;

    @Column(name = "oil_score", nullable = false)
    private int oilScore;

    @Column(name = "pigment_score", nullable = false)
    private int pigmentScore;

    @Column(name = "trouble_score", nullable = false)
    private int troubleScore;

    @Column(name = "condition_text", length = 500)
    private String conditionText;

    protected SkinDiagnosisRegion() {
    }

    public SkinDiagnosisRegion(SkinDiagnosis diagnosis, String region, String conditionText) {
        this.diagnosis = diagnosis;
        this.region = region;
        this.conditionText = conditionText;
        this.oilScore = 0;
        this.pigmentScore = 0;
        this.troubleScore = 0;
    }
}

