package com.skinclinic.domain.procedure.review.entity;

import com.skinclinic.domain.skin.recommendation.enumtype.ProcedureType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "procedure_record")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProcedureRecord {

    @Id
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ProcedureType procedureType;

    @Column(nullable = false, length = 100)
    private String procedureName;

    @Column(nullable = false)
    private LocalDate treatedAt;

    @Column(nullable = false)
    private boolean completed;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public ProcedureRecord(
            Long id,
            Long userId,
            ProcedureType procedureType,
            String procedureName,
            LocalDate treatedAt,
            boolean completed
    ) {
        this.id = id;
        this.userId = userId;
        this.procedureType = procedureType;
        this.procedureName = procedureName;
        this.treatedAt = treatedAt;
        this.completed = completed;
        this.createdAt = LocalDateTime.now();
    }
}
