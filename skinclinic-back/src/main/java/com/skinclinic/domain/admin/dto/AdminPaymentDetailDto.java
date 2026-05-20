package com.skinclinic.domain.admin.dto;

import com.skinclinic.domain.payment.entity.Payment;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class AdminPaymentDetailDto {
    private Long id;
    private String orderId;
    private Long memberId;
    private String memberLoginId;
    private String memberName;
    private String memberEmail;
    private Long procedureId;
    private String procedureName;
    private Integer amount;
    private String status;
    private String paymentMethod;
    private String tid;
    private LocalDateTime paidAt;
    private LocalDateTime createdAt;
    private String reservationLinkStatus;

    public static AdminPaymentDetailDto from(Payment payment) {
        return AdminPaymentDetailDto.builder()
                .id(payment.getId())
                .orderId(payment.getOrderId())
                .memberId(payment.getMember().getId())
                .memberLoginId(payment.getMember().getLoginId())
                .memberName(payment.getMember().getName())
                .memberEmail(payment.getMember().getEmail())
                .procedureId(payment.getProcedure().getId())
                .procedureName(payment.getProcedureName())
                .amount(payment.getAmount())
                .status(payment.getStatus().name())
                .paymentMethod(payment.getPaymentMethod())
                .tid(payment.getTid())
                .paidAt(payment.getPaidAt())
                .createdAt(payment.getCreatedAt())
                .reservationLinkStatus("현재 연결된 예약 정보 없음")
                .build();
    }
}
