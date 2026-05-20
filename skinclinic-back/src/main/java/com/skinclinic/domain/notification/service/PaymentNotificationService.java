package com.skinclinic.domain.notification.service;

import com.skinclinic.domain.notification.dto.NotificationEventTriggerRequest;
import com.skinclinic.domain.notification.dto.NotificationResponse;
import com.skinclinic.domain.notification.dto.PaymentNotificationCommand;
import com.skinclinic.domain.notification.enumtype.NotificationType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PaymentNotificationService {

    private final NotificationService notificationService;

    public NotificationResponse notifyPaymentCompleted(PaymentNotificationCommand command) {
        String paymentReference = hasText(command.paymentReference())
                ? command.paymentReference()
                : "결제 완료";

        return notificationService.triggerNotificationEvent(
                new NotificationEventTriggerRequest(
                        command.memberId(),
                        NotificationType.PAYMENT,
                        hasText(command.title()) ? command.title() : null,
                        hasText(command.message()) ? command.message() : null,
                        paymentReference
                )
        );
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
