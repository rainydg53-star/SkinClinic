package com.skinclinic.domain.procedure.dto;

import com.skinclinic.domain.procedure.entity.ProcedureCategory;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ProcedureCategoryResponseDto {
    private Long id;
    private String name;

    public static ProcedureCategoryResponseDto from(ProcedureCategory category) {
        return ProcedureCategoryResponseDto.builder()
                .id(category.getId())
                .name(category.getName())
                .build();
    }
}
