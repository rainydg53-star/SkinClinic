package com.skinclinic.domain.admin.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AdminMonthlySalesPointDto {
    private int month;
    private long salesAmount;
}

