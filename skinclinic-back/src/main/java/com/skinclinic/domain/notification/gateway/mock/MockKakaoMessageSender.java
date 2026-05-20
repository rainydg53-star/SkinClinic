package com.skinclinic.domain.notification.gateway.mock;

import com.skinclinic.domain.notification.enumtype.FailureReason;
import com.skinclinic.domain.notification.gateway.KakaoMessageSender;
import com.skinclinic.domain.notification.port.NotificationMemberInfo;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(
        value = "notification.kakao.provider",
        havingValue = "mock",
        matchIfMissing = true
)
public class MockKakaoMessageSender implements KakaoMessageSender {
// KakaoMessageSender의 mock 구현체

    @Override
    public KakaoSendResult sendToMe(NotificationMemberInfo memberInfo, String title, String message) {
        if (!memberInfo.kakaoLogin()) {
            // 카카오 로그인 여부 확인
            return new KakaoSendResult(false, FailureReason.AUTH_ERROR, "카카오 로그인이 필요합니다.");
        }

        if (!memberInfo.talkMessageAgreed()) {
            // talk_message 동의 여부 확인
            return new KakaoSendResult(false, FailureReason.TALK_MESSAGE_NOT_ALLOWED, "talk_message 동의가 필요합니다.");
        }

        if (!memberInfo.hasAccessToken()) {
            // access token 존재 여부 확인
            return new KakaoSendResult(false, FailureReason.AUTH_ERROR, "access token 이 없습니다.");
        }

        if (memberInfo.isAccessTokenExpired() || memberInfo.accessToken().startsWith("expired")) {
            // access token 만료 여부 확인
            return new KakaoSendResult(false, FailureReason.TOKEN_EXPIRED, "access token 이 만료되었습니다.");
        }

        if (memberInfo.accessToken().startsWith("invalid")) {
            // invalid 토큰 처리
            return new KakaoSendResult(false, FailureReason.AUTH_ERROR, "access token 인증 오류입니다.");
        }

        return new KakaoSendResult(true, FailureReason.NONE, "[MOCK_KAKAO] 나에게 메시지 보내기 성공");
        // 모든 조건 통과 시 성공
    }
}
