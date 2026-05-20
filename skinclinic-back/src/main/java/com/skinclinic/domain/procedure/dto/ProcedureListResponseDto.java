package com.skinclinic.domain.procedure.dto;

import com.skinclinic.domain.procedure.entity.Procedure;
import lombok.Builder;
import lombok.Getter;

@Getter
public class ProcedureListResponseDto {

    private final Long id;
    private final String name;
    private final String summary;
    private final Integer price;
    private final String imageUrl;
    private final String category;

    @Builder
    public ProcedureListResponseDto(Long id, String name, String summary,
                                    Integer price, String imageUrl, String category) {
        this.id = id;
        this.name = name;
        this.summary = summary;
        this.price = price;
        this.imageUrl = imageUrl;
        this.category = category;
    }

    public static ProcedureListResponseDto from(Procedure procedure) {
        return ProcedureListResponseDto.builder()
                .id(procedure.getId())
                .name(procedure.getName())
                .summary(procedure.getSummary())
                .price(procedure.getPrice())
                .imageUrl(procedure.getImageUrl())
                .category(procedure.getCategory())
                .build();
    }
}