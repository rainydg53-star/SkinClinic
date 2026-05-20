package com.skinclinic.domain.payment.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PortOnePaymentPrepareResponseDto {
    private String storeId;
    private String channelKey;
    private String paymentId;
    private String orderName;
    private Integer totalAmount;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private String redirectUrl;
}
