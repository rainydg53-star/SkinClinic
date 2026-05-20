package com.skinclinic.domain.notification.service;

import com.skinclinic.domain.notification.dto.NotificationCreateRequest;
import com.skinclinic.domain.notification.dto.NotificationEventTriggerRequest;
import com.skinclinic.domain.notification.dto.NotificationMemberResponse;
import com.skinclinic.domain.notification.dto.NotificationResponse;
import com.skinclinic.domain.notification.entity.NotificationAttempt;
import com.skinclinic.domain.notification.entity.NotificationHistory;
import com.skinclinic.domain.notification.enumtype.DeliveryChannel;
import com.skinclinic.domain.notification.enumtype.DeliveryStatus;
import com.skinclinic.domain.notification.enumtype.FailureReason;
import com.skinclinic.domain.notification.enumtype.NotificationType;
import com.skinclinic.domain.notification.gateway.KakaoMessageSender;
import com.skinclinic.domain.notification.gateway.KakaoTokenRefresher;
import com.skinclinic.domain.notification.gateway.SmsSender;
import com.skinclinic.domain.notification.port.MemberNotificationReader;
import com.skinclinic.domain.notification.port.NotificationMemberInfo;
import com.skinclinic.domain.notification.repository.NotificationHistoryRepository;
import jakarta.annotation.PostConstruct;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationHistoryRepository notificationHistoryRepository;
    private final MemberNotificationReader memberNotificationReader;
    private final SmsSender smsSender;
    private final KakaoMessageSender kakaoMessageSender;
    private final KakaoTokenRefresher kakaoTokenRefresher;

    @PostConstruct
    void initDummyData() {
        if (notificationHistoryRepository.count() > 0) {
            return;
        }

        memberNotificationReader.findByMemberId(1L).ifPresentOrElse(
                member -> {
                    try {
                        triggerNotificationEvent(new NotificationEventTriggerRequest(
                                member.memberId(),
                                NotificationType.RESERVATION,
                                null,
                                null,
                                "2026-03-25 14:00 예약 확정"
                        ));
                    } catch (Exception exception) {
                        log.warn("더미 알림 데이터 생성 실패. cause={}", exception.getMessage());
                    }
                },
                () -> log.info("memberId=1 회원이 없어 더미 알림 데이터를 생성하지 않습니다.")
        );
    }

    public List<NotificationResponse> getUserNotifications(Long userId, NotificationType type) {
        List<NotificationHistory> histories = type == null
                ? notificationHistoryRepository.findByUserIdOrderByCreatedAtDesc(userId)
                : notificationHistoryRepository.findByUserIdAndTypeOrderByCreatedAtDesc(userId, type);

        return histories.stream()
                .map(NotificationHistory::toResponse)
                .toList();
    }

    public long getUnreadCount(Long userId) {
        return notificationHistoryRepository.countByUserIdAndIsReadFalse(userId);
    }

    public NotificationResponse createNotification(NotificationCreateRequest request) {
        NotificationMemberInfo member = getMemberOrThrow(request.userId());

        NotificationHistory history = new NotificationHistory(
                request.userId(),
                member.memberName(),
                member.memberType(),
                request.type(),
                request.title(),
                request.message(),
                request.kakaoShareAvailable() && member.canSendKakaoMemo()
        );

        history.setDeliverySummary("관리자 알림 등록 완료");
        return notificationHistoryRepository.save(history).toResponse();
    }

    public NotificationResponse triggerNotificationEvent(NotificationEventTriggerRequest request) {
        NotificationMemberInfo member = getMemberOrThrow(request.userId());

        NotificationHistory history = new NotificationHistory(
                member.memberId(),
                member.memberName(),
                member.memberType(),
                request.type(),
                buildTitle(request, member),
                buildMessage(request, member),
                member.canSendKakaoMemo()
        );

        dispatch(history, member);
        return notificationHistoryRepository.save(history).toResponse();
    }

    public NotificationResponse markAsRead(Long notificationId) {
        NotificationHistory history = getHistoryOrThrow(notificationId);
        history.markAsRead();
        return notificationHistoryRepository.save(history).toResponse();
    }

    public NotificationResponse markKakaoSent(Long notificationId) {
        NotificationHistory history = getHistoryOrThrow(notificationId);

        history.addAttempt(new NotificationAttempt(
                history.nextAttemptSequence(),
                DeliveryChannel.KAKAO_MEMO,
                DeliveryStatus.SUCCESS,
                FailureReason.NONE,
                "카카오 수동 발송 처리되었습니다.",
                LocalDateTime.now()
        ));
        history.markKakaoSentManually();

        return notificationHistoryRepository.save(history).toResponse();
    }

    public List<NotificationResponse> getAllNotifications(NotificationType type) {
        List<NotificationHistory> histories = type == null
                ? notificationHistoryRepository.findAll()
                : notificationHistoryRepository.findByTypeOrderByCreatedAtDesc(type);

        return histories.stream()
                .sorted(Comparator.comparing(NotificationHistory::getCreatedAt).reversed())
                .map(NotificationHistory::toResponse)
                .toList();
    }

    public List<NotificationMemberResponse> getNotificationMembers() {
        return memberNotificationReader.findAll().stream()
                .sorted(Comparator.comparing(NotificationMemberInfo::memberId))
                .map(member -> new NotificationMemberResponse(
                        member.memberId(),
                        member.memberName(),
                        member.memberType(),
                        member.phone(),
                        member.kakaoLogin(),
                        member.talkMessageAgreed(),
                        member.hasAccessToken(),
                        member.hasRefreshToken(),
                        member.demoScenario()
                ))
                .toList();
    }

    private void dispatch(NotificationHistory history, NotificationMemberInfo member) {
        if (member.canSendKakaoMemo()) {
            sendKakaoWithRetryAndFallback(history, member);
            return;
        }

        sendSms(history, member, false, "카카오 발송 불가: SMS로 전환합니다.");
    }

    private void sendKakaoWithRetryAndFallback(NotificationHistory history, NotificationMemberInfo member) {
        KakaoMessageSender.KakaoSendResult firstTry =
                kakaoMessageSender.sendToMe(member, history.getTitle(), history.getMessage());

        history.addAttempt(new NotificationAttempt(
                history.nextAttemptSequence(),
                DeliveryChannel.KAKAO_MEMO,
                firstTry.success() ? DeliveryStatus.SUCCESS : DeliveryStatus.FAILED,
                firstTry.failureReason(),
                "1차 카카오 발송 결과: " + firstTry.detail(),
                LocalDateTime.now()
        ));

        if (firstTry.success()) {
            history.setDeliverySummary(firstTry.detail());
            return;
        }

        if (isRetryable(firstTry.failureReason()) && member.hasRefreshToken()) {
            KakaoTokenRefresher.KakaoTokenRefreshResult refreshResult = kakaoTokenRefresher.refresh(member);

            if (refreshResult.success()) {
                NotificationMemberInfo refreshedMember =
                        member.withNewAccessToken(refreshResult.newAccessToken(), refreshResult.newExpiresAt());

                history.addAttempt(new NotificationAttempt(
                        history.nextAttemptSequence(),
                        DeliveryChannel.KAKAO_MEMO,
                        DeliveryStatus.SUCCESS,
                        FailureReason.NONE,
                        "access token 갱신 성공: " + refreshResult.detail(),
                        LocalDateTime.now()
                ));

                KakaoMessageSender.KakaoSendResult retryTry =
                        kakaoMessageSender.sendToMe(refreshedMember, history.getTitle(), history.getMessage());

                history.addAttempt(new NotificationAttempt(
                        history.nextAttemptSequence(),
                        DeliveryChannel.KAKAO_MEMO,
                        retryTry.success() ? DeliveryStatus.SUCCESS : DeliveryStatus.FAILED,
                        retryTry.failureReason(),
                        "2차 카카오 발송 결과: " + retryTry.detail(),
                        LocalDateTime.now()
                ));

                if (retryTry.success()) {
                    history.setDeliverySummary(retryTry.detail());
                    return;
                }

                sendSms(history, member, true, "카카오 재시도 실패: SMS fallback");
                return;
            }

            history.addAttempt(new NotificationAttempt(
                    history.nextAttemptSequence(),
                    DeliveryChannel.KAKAO_MEMO,
                    DeliveryStatus.FAILED,
                    FailureReason.AUTH_ERROR,
                    "access token 갱신 실패: " + refreshResult.detail(),
                    LocalDateTime.now()
            ));

            sendSms(history, member, true, "카카오 토큰 갱신 실패: SMS fallback");
            return;
        }

        sendSms(history, member, true, "카카오 발송 실패: SMS fallback");
    }

    private void sendSms(
            NotificationHistory history,
            NotificationMemberInfo member,
            boolean fallback,
            String summary
    ) {
        if (!member.hasPhone()) {
            history.addAttempt(new NotificationAttempt(
                    history.nextAttemptSequence(),
                    DeliveryChannel.SMS,
                    DeliveryStatus.FAILED,
                    FailureReason.NO_PHONE_NUMBER,
                    "수신자 전화번호가 없어 SMS를 발송할 수 없습니다.",
                    LocalDateTime.now()
            ));
            history.setDeliverySummary("SMS 발송 실패: 수신자 전화번호 없음");
            return;
        }

        SmsSender.SmsSendResult result = smsSender.send(member.phone(), history.getTitle(), history.getMessage());

        history.addAttempt(new NotificationAttempt(
                history.nextAttemptSequence(),
                DeliveryChannel.SMS,
                result.success() ? (fallback ? DeliveryStatus.FALLBACK_SUCCESS : DeliveryStatus.SUCCESS) : DeliveryStatus.FAILED,
                result.success() ? FailureReason.NONE : FailureReason.UNKNOWN,
                result.detail(),
                LocalDateTime.now()
        ));

        history.setDeliverySummary(result.success()
                ? summary + " 요청 접수 / " + result.detail()
                : summary + " 실패 / " + result.detail());
    }

    private boolean isRetryable(FailureReason failureReason) {
        return failureReason == FailureReason.TOKEN_EXPIRED || failureReason == FailureReason.AUTH_ERROR;
    }

    private NotificationMemberInfo getMemberOrThrow(Long memberId) {
        return memberNotificationReader.findByMemberId(memberId)
                .orElseThrow(() -> new IllegalArgumentException("해당 회원을 찾을 수 없습니다. memberId=" + memberId));
    }

    private NotificationHistory getHistoryOrThrow(Long notificationId) {
        return notificationHistoryRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("해당 알림을 찾을 수 없습니다. id=" + notificationId));
    }

    private String buildTitle(NotificationEventTriggerRequest request, NotificationMemberInfo member) {
        if (request.title() != null && !request.title().isBlank()) {
            return request.title();
        }

        return switch (request.type()) {
            case RESERVATION -> member.memberName() + "님 예약 안내";
            case PAYMENT -> member.memberName() + "님 결제 완료 안내";
            case CONSULTATION -> member.memberName() + "님 1:1 상담 안내";
            case CANCELLATION -> member.memberName() + "님 취소 안내";
        };
    }

    private String buildMessage(NotificationEventTriggerRequest request, NotificationMemberInfo member) {
        if (request.message() != null && !request.message().isBlank()) {
            return request.message();
        }

        String reference = request.eventReference() == null || request.eventReference().isBlank()
                ? "상세 정보는 마이페이지에서 확인해주세요."
                : request.eventReference();

        return switch (request.type()) {
            case RESERVATION -> member.memberName() + "님의 예약 이벤트가 발생했습니다. " + reference;
            case PAYMENT -> member.memberName() + "님의 결제 이벤트가 발생했습니다. " + reference;
            case CONSULTATION -> member.memberName() + "님의 1:1 상담 이벤트가 발생했습니다. " + reference;
            case CANCELLATION -> member.memberName() + "님의 취소 이벤트가 발생했습니다. " + reference;
        };
    }
}