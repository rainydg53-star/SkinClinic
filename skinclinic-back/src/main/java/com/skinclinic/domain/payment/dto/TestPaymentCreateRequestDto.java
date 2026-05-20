package com.skinclinic.domain.payment.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TestPaymentCreateRequestDto {

    @NotNull
    private Long procedureId;

    private String paymentMethod;
}
