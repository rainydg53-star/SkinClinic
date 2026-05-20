package com.skinclinic.domain.payment.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class KakaoPayApproveRequestDto {

    @NotBlank
    private String orderId;

    @NotBlank
    private String pgToken;
}
