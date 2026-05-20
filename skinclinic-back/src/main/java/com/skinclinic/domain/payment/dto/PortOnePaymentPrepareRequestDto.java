package com.skinclinic.domain.payment.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class PortOnePaymentPrepareRequestDto {

    @NotNull(message = "Procedure ID is required.")
    private Long procedureId;

    @NotNull(message = "Reservation ID is required.")
    private Long reservationId;
}
