package com.skinclinic.domain.reservation.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

public record ReservationCreateRequest(
        @NotNull Long procedureId,
        @NotNull LocalDate reservationDate,
        @NotNull LocalTime reservationTime
) {
}

