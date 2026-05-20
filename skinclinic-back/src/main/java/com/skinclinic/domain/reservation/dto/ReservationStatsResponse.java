package com.skinclinic.domain.reservation.dto;

import java.time.LocalDate;

public record ReservationStatsResponse(
        LocalDate date,
        long todayCount,
        long totalCount
) {
}

