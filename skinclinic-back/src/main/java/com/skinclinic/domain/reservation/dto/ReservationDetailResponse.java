package com.skinclinic.domain.reservation.dto;

import com.skinclinic.domain.reservation.entity.Reservation;
import com.skinclinic.domain.reservation.entity.ReservationStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public record ReservationDetailResponse(
        Long reservationId,
        Long memberId,
        String memberName,
        Long procedureId,
        String procedureName,
        LocalDate reservationDate,
        LocalTime reservationTime,
        ReservationStatus status,
        LocalDateTime createdAt
) {
    public static ReservationDetailResponse from(Reservation reservation) {
        return new ReservationDetailResponse(
                reservation.getId(),
                reservation.getMember().getId(),
                reservation.getMember().getName(),
                reservation.getProcedure().getId(),
                reservation.getProcedure().getName(),
                reservation.getReservationDate(),
                reservation.getReservationTime(),
                reservation.getStatus(),
                reservation.getCreatedAt()
        );
    }
}
