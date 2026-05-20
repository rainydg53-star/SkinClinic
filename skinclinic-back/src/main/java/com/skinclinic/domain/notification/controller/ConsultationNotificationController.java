package com.skinclinic.domain.notification.controller;

import com.skinclinic.domain.notification.dto.ConsultationNotificationCommand;
import com.skinclinic.domain.notification.dto.NotificationResponse;
import com.skinclinic.domain.notification.service.ConsultationNotificationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/notifications/consultations")
public class ConsultationNotificationController {

    private final ConsultationNotificationService consultationNotificationService;

    @PostMapping("/received")
    public NotificationResponse notifyConsultationReceived(
            @RequestBody @Valid ConsultationNotificationTriggerRequest request
    ) {
        return consultationNotificationService.notifyConsultationReceived(toCommand(request));
    }

    @PostMapping("/answered")
    public NotificationResponse notifyConsultationAnswered(
            @RequestBody @Valid ConsultationNotificationTriggerRequest request
    ) {
        return consultationNotificationService.notifyConsultationAnswered(toCommand(request));
    }

    private ConsultationNotificationCommand toCommand(ConsultationNotificationTriggerRequest request) {
        return new ConsultationNotificationCommand(
                request.memberId(),
                request.consultationReference(),
                request.title(),
                request.message()
        );
    }

    public record ConsultationNotificationTriggerRequest(
            @NotNull Long memberId,
            String consultationReference,
            String title,
            String message
    ) {
    }
}
