package com.skinclinic.domain.notification.dto;

import com.skinclinic.domain.notification.enumtype.NotificationType;
import jakarta.validation.constraints.NotNull;

public record NotificationEventTriggerRequest(
        // 예약/결제/상담 같은 이벤트가 발생했을 때 자동 알림을 트리거하기 위한 요청 DTO
        @NotNull Long userId,
        @NotNull NotificationType type,
        String title,
        String message,
        String eventReference
) {
}