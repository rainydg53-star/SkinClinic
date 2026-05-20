package com.skinclinic.domain.treatmentrecord.entity;



import com.skinclinic.domain.member.entity.Member;
import com.skinclinic.domain.payment.entity.Payment;
import com.skinclinic.domain.procedure.entity.Procedure;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "treatment_record")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TreatmentRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY,optional = false)
    @JoinColumn(name = "member_id")
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY,optional = false)
    @JoinColumn(name = "procedure_id")
    private Procedure procedure;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id")
    private Payment payment;

    @Column(nullable = false,length = 100)
    private String procedureName;

    @Column(nullable = false)
    private LocalDate treatmentDate;

    @Lob
    private String notes;

    @Column(length = 255)
    private String beforeImageUrl;

    @Column(length = 255)
    private String afterImageUrl;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Builder
    public TreatmentRecord(Long id, Member member, Procedure procedure, Payment payment, String procedureName, LocalDate treatmentDate, String notes, String beforeImageUrl, String afterImageUrl, LocalDateTime createdAt) {
        this.id = id;
        this.member = member;
        this.procedure = procedure;
        this.payment = payment;
        this.procedureName = procedureName;
        this.treatmentDate = treatmentDate;
        this.notes = notes;
        this.beforeImageUrl = beforeImageUrl;
        this.afterImageUrl = afterImageUrl;
        this.createdAt = createdAt;
    }
}
