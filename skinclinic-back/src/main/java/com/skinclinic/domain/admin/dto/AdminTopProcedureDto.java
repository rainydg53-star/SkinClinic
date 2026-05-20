package com.skinclinic.domain.admin.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AdminTopProcedureDto {
    private int rank;
    private Long procedureId;
    private String procedureName;
    private long totalAmount;
    private long totalCount;
}

