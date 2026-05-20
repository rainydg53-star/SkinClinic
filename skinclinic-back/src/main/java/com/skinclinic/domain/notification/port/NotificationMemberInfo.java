package com.skinclinic.domain.notification.port;

import com.skinclinic.domain.notification.enumtype.MemberType;

import java.time.LocalDateTime;

public record NotificationMemberInfo(
        Long memberId,
        String memberName,
        String phone,
        MemberType memberType,
        boolean kakaoLogin,
        boolean talkMessageAgreed,
        String accessToken,
        String refreshToken,
        LocalDateTime accessTokenExpiresAt,
        String demoScenario
) {
    // 알림 발송에 필요한 회원 정보를 담는 값 객체

    public boolean hasPhone() {
        // 전화번호가 있는지
        return phone != null && !phone.isBlank();
    }

    public boolean hasAccessToken() {
        // 액세스 토큰이 있는지
        return accessToken != null && !accessToken.isBlank();
    }

    public boolean hasRefreshToken() {
        // 리프레시 토큰이 있는지
        return refreshToken != null && !refreshToken.isBlank();
    }

    public boolean isAccessTokenExpired() {
        // 액세스 토큰이 만료되었는지
        return accessTokenExpiresAt == null || LocalDateTime.now().isAfter(accessTokenExpiresAt);
    }

    public boolean canSendKakaoMemo() {
        // 카카오 나에게 메시지를 보낼 수 있는 기본 조건
        return memberType == MemberType.KAKAO // 카카오 회원
                && kakaoLogin // 카카오 로그인 사용자
                && talkMessageAgreed // 톡 메시지 동의
                && hasAccessToken(); // 액세스 토큰
    }

    public NotificationMemberInfo withNewAccessToken(String newAccessToken, LocalDateTime newExpiresAt) {
        return new NotificationMemberInfo(
                memberId,
                memberName,
                phone,
                memberType,
                kakaoLogin,
                talkMessageAgreed,
                newAccessToken,
                refreshToken,
                newExpiresAt,
                demoScenario
        );
    }
}