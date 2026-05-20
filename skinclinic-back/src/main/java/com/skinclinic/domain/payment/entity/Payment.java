package com.skinclinic.domain.payment.entity;

import com.skinclinic.domain.member.entity.Member;
import com.skinclinic.domain.procedure.entity.Procedure;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "payment")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 60)
    private String orderId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id")
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "procedure_id")
    private Procedure procedure;

    @Column(name = "reservation_id")
    private Long reservationId;

    @Column(nullable = false, length = 100)
    private String procedureName;

    @Column(nullable = false)
    private Integer amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentStatus status;

    @Column(nullable = false, length = 30)
    private String paymentMethod;

    @Column(length = 100)
    private String tid;

    private LocalDateTime paidAt;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Builder
    public Payment(String orderId, Member member, Procedure procedure, Long reservationId, String procedureName, Integer amount,
                   PaymentStatus status, String paymentMethod, String tid, LocalDateTime paidAt, LocalDateTime createdAt) {
        this.orderId = orderId;
        this.member = member;
        this.procedure = procedure;
        this.reservationId = reservationId;
        this.procedureName = procedureName;
        this.amount = amount;
        this.status = status;
        this.paymentMethod = paymentMethod;
        this.tid = tid;
        this.paidAt = paidAt;
        this.createdAt = createdAt;
    }

    public void updateTid(String tid) {
        this.tid = tid;
    }

    public void markPaid(LocalDateTime paidAt) {
        this.status = PaymentStatus.PAID;
        this.paidAt = paidAt;
    }

    public void markCanceled() {
        this.status = PaymentStatus.CANCELED;
    }

    public void markFailed() {
        this.status = PaymentStatus.FAILED;
    }

    public void markExpired() {
        this.status = PaymentStatus.EXPIRED;
    }
}
