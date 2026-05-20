package com.skinclinic.domain.procedure.dto;

import com.skinclinic.domain.procedure.entity.Procedure;
import lombok.Builder;
import lombok.Getter;

@Getter
public class ProcedureAdminListResponseDto {

    private final Long id;
    private final String name;
    private final String category;
    private final Integer price;
    private final boolean visible;

    @Builder
    public ProcedureAdminListResponseDto(Long id, String name, String category, Integer price, boolean visible) {
        this.id = id;
        this.name = name;
        this.category = category;
        this.price = price;
        this.visible = visible;
    }

    public static ProcedureAdminListResponseDto from(Procedure procedure) {
        return ProcedureAdminListResponseDto.builder()
                .id(procedure.getId())
                .name(procedure.getName())
                .category(procedure.getCategory())
                .price(procedure.getPrice())
                .visible(procedure.isVisible())
                .build();
    }
}