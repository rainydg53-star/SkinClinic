package com.skinclinic.domain.notification.service;

import com.skinclinic.domain.notification.dto.NotificationEventTriggerRequest;
import com.skinclinic.domain.notification.dto.NotificationResponse;
import com.skinclinic.domain.notification.dto.ReservationNotificationCommand;
import com.skinclinic.domain.notification.enumtype.NotificationType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ReservationNotificationService {

    private final NotificationService notificationService;

    public NotificationResponse notifyReservationEvent(ReservationNotificationCommand command) {
        return notifyByType(command, NotificationType.RESERVATION);
    }

    public NotificationResponse notifyReservationCancellationEvent(ReservationNotificationCommand command) {
        return notifyByType(command, NotificationType.CANCELLATION);
    }

    public NotificationResponse notifyReservationCompleted(ReservationNotificationCommand command) {
        return notifyReservationEvent(command);
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private NotificationResponse notifyByType(ReservationNotificationCommand command, NotificationType type) {
        String reservationReference = hasText(command.reservationReference())
                ? command.reservationReference()
                : "예약 안내";

        return notificationService.triggerNotificationEvent(
                new NotificationEventTriggerRequest(
                        command.memberId(),
                        type,
                        hasText(command.title()) ? command.title() : null,
                        hasText(command.message()) ? command.message() : null,
                        reservationReference
                )
        );
    }
}
