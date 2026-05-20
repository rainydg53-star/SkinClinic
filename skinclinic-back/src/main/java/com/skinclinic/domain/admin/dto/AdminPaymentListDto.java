package com.skinclinic.domain.admin.dto;

import com.skinclinic.domain.payment.entity.Payment;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class AdminPaymentListDto {
    private Long id;
    private String orderId;
    private Long memberId;
    private String memberLoginId;
    private String memberName;
    private Long procedureId;
    private String procedureName;
    private Integer amount;
    private String status;
    private String paymentMethod;
    private LocalDateTime paidAt;
    private LocalDateTime createdAt;

    public static AdminPaymentListDto from(Payment payment) {
        return AdminPaymentListDto.builder()
                .id(payment.getId())
                .orderId(payment.getOrderId())
                .memberId(payment.getMember().getId())
                .memberLoginId(payment.getMember().getLoginId())
                .memberName(payment.getMember().getName())
                .procedureId(payment.getProcedure() == null ? null : payment.getProcedure().getId())
                .procedureName(payment.getProcedureName())
                .amount(payment.getAmount())
                .status(payment.getStatus().name())
                .paymentMethod(payment.getPaymentMethod())
                .paidAt(payment.getPaidAt())
                .createdAt(payment.getCreatedAt())
                .build();
    }
}
