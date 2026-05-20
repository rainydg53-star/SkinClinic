package com.skinclinic.domain.notification.dto;

import com.skinclinic.domain.notification.enumtype.DeliveryChannel;
import com.skinclinic.domain.notification.enumtype.DeliveryStatus;
import com.skinclinic.domain.notification.enumtype.FailureReason;

import java.time.LocalDateTime;

public record NotificationDeliveryAttemptResponse(
        Long sequence,
        DeliveryChannel channel,
        DeliveryStatus status,
        boolean success,
        FailureReason failureReason,
        String detail,
        LocalDateTime attemptedAt
) {
    // 알림 발송 시도 1건의 상세 응답 객체 DTO
}