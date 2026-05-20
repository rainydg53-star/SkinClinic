package com.skinclinic.domain.notification.dto;

public record ConsultationNotificationCommand(
        Long memberId,
        String consultationReference,
        String title,
        String message
) {
}
