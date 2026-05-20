package com.skinclinic.domain.reservation.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record ReservationAvailabilityResponse(
        LocalDate date,
        LocalTime openTime,
        LocalTime closeTime,
        int slotMinutes,
        int maxPerSlot,
        boolean closedDay,
        List<Slot> slots
) {
    public record Slot(LocalTime time, boolean available, int reservedCount, int remainingCount) {
    }
}
