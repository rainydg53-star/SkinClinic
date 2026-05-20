package com.skinclinic.domain.notification.dto;

public record PaymentNotificationCommand(
        Long memberId,
        String paymentReference,
        String title,
        String message
) {
}
