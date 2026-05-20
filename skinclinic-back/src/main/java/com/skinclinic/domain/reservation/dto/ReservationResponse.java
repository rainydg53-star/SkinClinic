package com.skinclinic.domain.reservation.dto;

import com.skinclinic.domain.reservation.entity.Reservation;
import com.skinclinic.domain.reservation.entity.ReservationStatus;
import java.time.LocalDate;
import java.time.LocalTime;

public record ReservationResponse(
        Long reservationId,
        Long procedureId,
        String procedureName,
        LocalDate reservationDate,
        LocalTime reservationTime,
        ReservationStatus status
) {
    public static ReservationResponse from(Reservation reservation) {
        return new ReservationResponse(
                reservation.getId(),
                reservation.getProcedure().getId(),
                reservation.getProcedure().getName(),
                reservation.getReservationDate(),
                reservation.getReservationTime(),
                reservation.getStatus()
        );
    }
}

