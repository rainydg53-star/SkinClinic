package com.skinclinic.domain.notification.dto;

import com.skinclinic.domain.notification.enumtype.NotificationType;
import jakarta.validation.constraints.NotNull;

public record MyNotificationTriggerRequest(
        @NotNull NotificationType type,
        String title,
        String message,
        String eventReference
) {
}
