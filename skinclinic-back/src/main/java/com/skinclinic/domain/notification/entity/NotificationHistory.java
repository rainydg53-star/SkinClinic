package com.skinclinic.domain.notification.entity;

import com.skinclinic.domain.notification.dto.NotificationDeliveryAttemptResponse;
import com.skinclinic.domain.notification.dto.NotificationResponse;
import com.skinclinic.domain.notification.enumtype.DeliveryChannel;
import com.skinclinic.domain.notification.enumtype.MemberType;
import com.skinclinic.domain.notification.enumtype.NotificationType;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "notification_history")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class NotificationHistory {
// 알림 1건이 생성 될때, 즉 알림 본체
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;  // pk

    private Long userId;  // 알림 받는 사용자 id

    @Column(length = 50)
    private String userName;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private MemberType memberType;

    @Enumerated(EnumType.STRING)
    @Column(length = 30, nullable = false)
    private NotificationType type;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, length = 1000)
    private String message;

    private boolean isRead;  // 읽음 여부

    private boolean kakaoShareAvailable;  // 카카오 발송 가능 여부

    private boolean kakaoSent;  // 카카오 발송 성공 여부

    private boolean smsSent;  // SMS 발송 성공 여부

    @Column(length = 30)
    private String lastDeliveryChannel;  // 성공한 발송 채널

    @Column(length = 255)
    private String deliverySummary;  // 발송 상태를 사람이 보기 좋게 요약한 문자열

    private LocalDateTime createdAt;  // 생성 시각

    @OneToMany(mappedBy = "notificationHistory", cascade = CascadeType.ALL, orphanRemoval = true)  // NotificationHistory가 부모
    @OrderBy("sequence asc")
    private List<NotificationAttempt> attempts = new ArrayList<>();  //   발송 시도 목록 이력

    public NotificationHistory(
            Long userId,
            String userName,
            MemberType memberType,
            NotificationType type,
            String title,
            String message,
            boolean kakaoShareAvailable
    ) {
        this.userId = userId;
        this.userName = userName;
        this.memberType = memberType;
        this.type = type;
        this.title = title;
        this.message = message;
        this.kakaoShareAvailable = kakaoShareAvailable;
        this.deliverySummary = "발송 대기";
        this.createdAt = LocalDateTime.now();
    }

    public Long nextAttemptSequence() {
        //  발송 시도의 순번을 반환
        return (long) attempts.size() + 1L;
    }

    public void addAttempt(NotificationAttempt attempt) {
        attempt.assignNotificationHistory(this);  // 양방향 연관관계
        attempts.add(attempt);  // 부모 컬렉션에도 넣음

        if (attempt.isSuccess() && attempt.getChannel() == DeliveryChannel.KAKAO_MEMO) {
            kakaoSent = true; // 성공이면
            lastDeliveryChannel = DeliveryChannel.KAKAO_MEMO.name();
        }

        if (attempt.isSuccess() && attempt.getChannel() == DeliveryChannel.SMS) {
            smsSent = true;
            lastDeliveryChannel = DeliveryChannel.SMS.name();
        }
    }

    public void markAsRead() {
        // 사용자가 알림 읽었을 때 호출
        this.isRead = true;
    }

    public void markKakaoSentManually() {
        // 사용자가 수동으로 카카오 수신한 것으로 처리할 때
        this.kakaoSent = true;
        this.kakaoShareAvailable = true;
        this.lastDeliveryChannel = DeliveryChannel.KAKAO_MEMO.name();
        this.deliverySummary = "사용자 수동 카카오 수신 처리";
    }

    public void setDeliverySummary(String deliverySummary) {
        // 발송 결과 요약 문구 세팅
        this.deliverySummary = deliverySummary;
    }

    public NotificationResponse toResponse() {
        // 엔티티를 API 응답 DTO로 변환하는 메서드
        List<NotificationDeliveryAttemptResponse> attemptResponses = attempts.stream()
                .map(item -> new NotificationDeliveryAttemptResponse(
                        item.getSequence(),
                        item.getChannel(),
                        item.getStatus(),
                        item.isSuccess(),
                        item.getFailureReason(),
                        item.getDetail(),
                        item.getAttemptedAt()
                ))
                .toList();

        return new NotificationResponse(
                id,
                userId,
                userName,
                memberType,
                type,
                title,
                message,
                isRead,
                kakaoShareAvailable,
                kakaoSent,
                smsSent,
                lastDeliveryChannel,
                deliverySummary,
                attemptResponses,
                createdAt
        );
    }
}