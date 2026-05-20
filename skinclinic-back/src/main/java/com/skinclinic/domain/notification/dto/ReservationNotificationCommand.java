package com.skinclinic.domain.notification.dto;

public record ReservationNotificationCommand(
        Long memberId,
        String reservationReference,
        String title,
        String message
) {
}
