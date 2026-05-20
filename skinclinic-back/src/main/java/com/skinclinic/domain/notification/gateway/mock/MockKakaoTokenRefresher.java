package com.skinclinic.domain.notification.gateway.mock;

import com.skinclinic.domain.notification.gateway.KakaoTokenRefresher;
import com.skinclinic.domain.notification.port.NotificationMemberInfo;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@ConditionalOnProperty(
        value = "notification.kakao.provider",
        havingValue = "mock",
        matchIfMissing = true
)
public class MockKakaoTokenRefresher implements KakaoTokenRefresher {
    // KakaoTokenRefresher의 mock 구현체

    @Override
    public KakaoTokenRefreshResult refresh(NotificationMemberInfo memberInfo) {
        if (!memberInfo.hasRefreshToken()) {
            // refresh token 존재 여부 확인
            return new KakaoTokenRefreshResult(false, null, null, "refresh token 이 없습니다.");
        }

        if (memberInfo.refreshToken().startsWith("refresh-ok")) {
            return new KakaoTokenRefreshResult(
                    true,
                    "valid-refreshed-token-user-" + memberInfo.memberId(), // 새 access token 생성
                    LocalDateTime.now().plusHours(6),  // 만료시간 6시간 뒤로 설정
                    "refresh token 으로 access token 재발급 성공"  // 성공 detail 반환
            );
        }

        return new KakaoTokenRefreshResult(false, null, null, "refresh token 재발급 실패");
         // 나머지는 refresh 실패
    }
}
