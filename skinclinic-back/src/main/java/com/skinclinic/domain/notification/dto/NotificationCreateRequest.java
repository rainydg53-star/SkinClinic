package com.skinclinic.domain.notification.dto;

import com.skinclinic.domain.notification.enumtype.NotificationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record NotificationCreateRequest(
        // 관리자가 수동으로 알림을 생성할 때 받는 요청 객체
        @NotNull Long userId,
        @NotNull NotificationType type,
        @NotBlank String title,
        @NotBlank String message,
        boolean kakaoShareAvailable // 카카오 발송 가능 여부 선택
) {
}