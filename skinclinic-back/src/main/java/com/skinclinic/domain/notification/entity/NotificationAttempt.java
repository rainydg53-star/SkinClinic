package com.skinclinic.domain.notification.entity;

import com.skinclinic.domain.notification.enumtype.DeliveryChannel;
import com.skinclinic.domain.notification.enumtype.DeliveryStatus;
import com.skinclinic.domain.notification.enumtype.FailureReason;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "notification_attempt")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class NotificationAttempt {
  // 알림을 실제로 몇 번, 어떤 채널로, 어떤 결과로 보냈는지 기록

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // PK

    private Long sequence; // 알림 몇 번째 시도

    @Enumerated(EnumType.STRING)
    @Column(length = 30, nullable = false)
    private DeliveryChannel channel;  // 발송 채널

    @Enumerated(EnumType.STRING)
    @Column(length = 30, nullable = false)
    private DeliveryStatus status;  // 상태

    @Enumerated(EnumType.STRING)
    @Column(length = 30, nullable = false)
    private FailureReason failureReason;  // 실패 사유

    @Column(length = 255)
    private String detail;  // 실패나 성공에 대한 부가 설명

    private LocalDateTime attemptedAt; // 실제 발송 시도한 시각

    @ManyToOne(fetch = FetchType.LAZY)  // 알림 1건에 발송 시도 여러건 구조
    @JoinColumn(name = "notification_history_id", nullable = false)  // 를 외래키로 연결, 모든 attempt는 반드시 어떤 history에 속해야 함.
    private NotificationHistory notificationHistory; // 시도 기록이 어떤 알림에 속하는지

    public NotificationAttempt(
            Long sequence,
            DeliveryChannel channel,
            DeliveryStatus status,
            FailureReason failureReason,
            String detail,
            LocalDateTime attemptedAt
    ) {
        this.sequence = sequence;
        this.channel = channel;
        this.status = status;
        this.failureReason = failureReason;
        this.detail = detail;
        this.attemptedAt = attemptedAt;
    }

    public boolean isSuccess() {
        // 시도가 성공으로 볼 수 있는지 판단
        return status == DeliveryStatus.SUCCESS || status == DeliveryStatus.FALLBACK_SUCCESS;
    }

    public void assignNotificationHistory(NotificationHistory notificationHistory) {
        // 부모 엔티티를 연결하는 메서드
        this.notificationHistory = notificationHistory;
    }
}