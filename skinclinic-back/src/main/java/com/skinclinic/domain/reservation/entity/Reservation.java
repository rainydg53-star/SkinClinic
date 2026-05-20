package com.skinclinic.domain.reservation.entity;

import com.skinclinic.domain.member.entity.Member;
import com.skinclinic.domain.procedure.entity.Procedure;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import lombok.Getter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Getter
@Entity
@Table(name = "reservations")
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "procedure_id", nullable = false)
    private Procedure procedure;

    @Column(name = "reservation_date", nullable = false)
    private LocalDate reservationDate;

    @Column(name = "reservation_time", nullable = false)
    private LocalTime reservationTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReservationStatus status;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected Reservation() {
    }

    public static Reservation create(Member member, Procedure procedure, LocalDate date, LocalTime time) {
        Reservation reservation = new Reservation();
        reservation.member = member;
        reservation.procedure = procedure;
        reservation.reservationDate = date;
        reservation.reservationTime = time;
        reservation.status = ReservationStatus.PENDING;
        return reservation;
    }

    public void cancel() {
        if (this.status == ReservationStatus.CANCELED) {
            return;
        }
        if (this.status == ReservationStatus.COMPLETED) {
            throw new IllegalStateException("완료된 예약은 취소할 수 없습니다.");
        }
        this.status = ReservationStatus.CANCELED;
    }

    public void markCompleted() {
        if (this.status == ReservationStatus.CANCELED) {
            throw new IllegalStateException("취소된 예약은 완료 처리할 수 없습니다.");
        }
        this.status = ReservationStatus.COMPLETED;
    }

    public void markConfirmed() {
        if (this.status == ReservationStatus.CONFIRMED) {
            return;
        }
        if (this.status == ReservationStatus.CANCELED) {
            throw new IllegalStateException("취소된 예약은 확정할 수 없습니다.");
        }
        if (this.status == ReservationStatus.COMPLETED) {
            throw new IllegalStateException("완료된 예약은 확정할 수 없습니다.");
        }
        this.status = ReservationStatus.CONFIRMED;
    }
}
