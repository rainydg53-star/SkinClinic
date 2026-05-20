package com.skinclinic.domain.reservation.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDate;
import lombok.Getter;

@Getter
@Entity
@Table(
        name = "reservation_closed_day",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_reservation_closed_day_date", columnNames = "closed_date")
        }
)
public class ReservationClosedDay {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "closed_date", nullable = false)
    private LocalDate closedDate;

    protected ReservationClosedDay() {
    }

    public ReservationClosedDay(LocalDate closedDate) {
        this.closedDate = closedDate;
    }
}
