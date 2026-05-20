package com.skinclinic.domain.payment.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class PortOnePaymentCompleteRequestDto {

    @NotBlank(message = "Payment ID is required.")
    private String paymentId;
}
