package com.skinclinic.domain.payment.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class KakaoPayReadyResponseDto {
    private String orderId;
    private String redirectUrl;
}
