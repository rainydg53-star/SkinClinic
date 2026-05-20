package com.skinclinic.domain.notification.service;

import com.skinclinic.domain.notification.dto.ConsultationNotificationCommand;
import com.skinclinic.domain.notification.dto.NotificationEventTriggerRequest;
import com.skinclinic.domain.notification.dto.NotificationResponse;
import com.skinclinic.domain.notification.enumtype.NotificationType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ConsultationNotificationService {

    private final NotificationService notificationService;

    public NotificationResponse notifyConsultationReceived(ConsultationNotificationCommand command) {
        return trigger(command, "1:1 상담 접수 완료");
    }

    public NotificationResponse notifyConsultationAnswered(ConsultationNotificationCommand command) {
        return trigger(command, "1:1 상담 답변 등록 완료");
    }

    private NotificationResponse trigger(ConsultationNotificationCommand command, String defaultReference) {
        String consultationReference = hasText(command.consultationReference())
                ? command.consultationReference()
                : defaultReference;

        return notificationService.triggerNotificationEvent(
                new NotificationEventTriggerRequest(
                        command.memberId(),
                        NotificationType.CONSULTATION,
                        hasText(command.title()) ? command.title() : null,
                        hasText(command.message()) ? command.message() : null,
                        consultationReference
                )
        );
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
