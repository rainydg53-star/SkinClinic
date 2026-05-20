package com.skinclinic.domain.notification.dto;

import com.skinclinic.domain.notification.enumtype.MemberType;
import com.skinclinic.domain.notification.enumtype.NotificationType;

import java.time.LocalDateTime;
import java.util.List;

public record NotificationResponse(
        Long id, // 알림 이름 id
        Long userId, // 알림 받을 사용자 id
        String userName, // 알림 수신자 이름
        MemberType memberType, // 수신자 회원 타입
        NotificationType type, // 알림 종류
        String title,  // 제목
        String message,  // 본문
        boolean read,  // 읽음 여부
        boolean kakaoShareAvailable,  // 카카오 발송 가능 여부
        boolean kakaoSent,  // 카카오 발송 성공 여부
        boolean smsSent,  // SMS 발송 성공 여부
        String lastDeliveryChannel, // 성공한 발송 채널
        String deliverySummary,  // 발송 결과 요약 문자열
        List<NotificationDeliveryAttemptResponse> attempts,  // 발송 시도 이력 목록
        LocalDateTime createdAt // 알림 생성 시각
) {
    // 알림 목록 조회 / 알림 상세 조회의 메인 응답 DTO
}