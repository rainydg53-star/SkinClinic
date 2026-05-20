package com.skinclinic.domain.notification.gateway;

import com.skinclinic.domain.notification.enumtype.FailureReason;
import com.skinclinic.domain.notification.port.NotificationMemberInfo;

public interface KakaoMessageSender {
// 카카오 나에게 메시지 보내기 기능을 추상화한 인터페이스

    KakaoSendResult sendToMe(NotificationMemberInfo memberInfo, String title, String message);
    // 카카오 나에게 메시지를 보내는 메서드
    // 수신 회원 정보, 메시지 제목, 메시지 본문
    // SMS는 전화번호만 받는데, 카카오는 NotificationMemberInfo 전체를 받음(판단해야 할게 많아서)

    record KakaoSendResult(
            boolean success,
            FailureReason failureReason,
            String detail
    ) {
    }
}