package com.skinclinic.domain.payment.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class KakaoPayReadyRequestDto {

    @NotNull
    private Long procedureId;

    @NotNull
    private Long reservationId;
}
