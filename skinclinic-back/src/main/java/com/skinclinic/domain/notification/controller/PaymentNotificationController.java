package com.skinclinic.domain.notification.controller;

import com.skinclinic.domain.notification.dto.NotificationResponse;
import com.skinclinic.domain.notification.dto.PaymentNotificationCommand;
import com.skinclinic.domain.notification.service.PaymentNotificationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/notifications/payments")
public class PaymentNotificationController {

    private final PaymentNotificationService paymentNotificationService;

    @PostMapping("/completed")
    public NotificationResponse notifyPaymentCompleted(
            @RequestBody @Valid PaymentNotificationTriggerRequest request
    ) {
        return paymentNotificationService.notifyPaymentCompleted(
                new PaymentNotificationCommand(
                        request.memberId(),
                        request.paymentReference(),
                        request.title(),
                        request.message()
                )
        );
    }

    public record PaymentNotificationTriggerRequest(
            @NotNull Long memberId,
            String paymentReference,
            String title,
            String message
    ) {
    }
}
