package com.skinclinic.domain.notification.gateway;

import com.skinclinic.domain.notification.port.NotificationMemberInfo;

import java.time.LocalDateTime;

public interface KakaoTokenRefresher {
// 카카오 access token 재발급 기능을 추상화한 인터페이스

    KakaoTokenRefreshResult refresh(NotificationMemberInfo memberInfo);
    // 토큰 갱신 메서드, 리프레시 토큰 등을 가진 회원 정보를 사용

    record KakaoTokenRefreshResult(
            boolean success,
            String newAccessToken,
            LocalDateTime newExpiresAt,
            String detail
    ) {
    }
}