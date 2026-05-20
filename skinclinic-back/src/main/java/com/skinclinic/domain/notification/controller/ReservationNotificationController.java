package com.skinclinic.domain.notification.controller;

import com.skinclinic.domain.notification.dto.NotificationResponse;
import com.skinclinic.domain.notification.dto.ReservationNotificationCommand;
import com.skinclinic.domain.notification.service.ReservationNotificationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/notifications/reservations")
public class ReservationNotificationController {

    private final ReservationNotificationService reservationNotificationService;

    @PostMapping("/completed")
    public NotificationResponse notifyReservationCompleted(
            @RequestBody @Valid ReservationNotificationTriggerRequest request
    ) {
        return reservationNotificationService.notifyReservationCompleted(
                new ReservationNotificationCommand(
                        request.memberId(),
                        request.reservationReference(),
                        request.title(),
                        request.message()
                )
        );
    }

    public record ReservationNotificationTriggerRequest(
            @NotNull Long memberId,
            String reservationReference,
            String title,
            String message
    ) {
    }
}
