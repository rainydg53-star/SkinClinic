package com.skinclinic.domain.payment.dto;

import com.skinclinic.domain.payment.entity.Payment;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class PaymentResponseDto {
    private Long id;
    private String orderId;
    private Long reservationId;
    private Long procedureId;
    private String procedureName;
    private Integer amount;
    private String status;
    private String paymentMethod;
    private LocalDateTime paidAt;
    private LocalDateTime createdAt;
    private boolean cancelable;

    public static PaymentResponseDto from(Payment payment, boolean cancelable) {
        return PaymentResponseDto.builder()
                .id(payment.getId())
                .orderId(payment.getOrderId())
                .reservationId(payment.getReservationId())
                .procedureId(payment.getProcedure().getId())
                .procedureName(payment.getProcedureName())
                .amount(payment.getAmount())
                .status(payment.getStatus().name())
                .paymentMethod(payment.getPaymentMethod())
                .paidAt(payment.getPaidAt())
                .createdAt(payment.getCreatedAt())
                .cancelable(cancelable)
                .build();
    }
}
