package com.skinclinic.domain.procedure.dto;

import com.skinclinic.domain.procedure.entity.Procedure;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class ProcedureDetailResponseDto {

    private Long id;
    private String name;
    private String summary;
    private String description;
    private Integer price;
    private String imageUrl;
    private String category;
    private boolean visible;
    private List<String> detailImageUrls;

    public static ProcedureDetailResponseDto from(Procedure procedure) {
        return ProcedureDetailResponseDto.builder()
                .id(procedure.getId())
                .name(procedure.getName())
                .summary(procedure.getSummary())
                .description(procedure.getDescription())
                .price(procedure.getPrice())
                .imageUrl(procedure.getImageUrl())
                .category(procedure.getCategory())
                .visible(procedure.isVisible())
                .detailImageUrls(
                        procedure.getDetailImages().stream()
                                .sorted((a, b) -> Integer.compare(a.getSortOrder(), b.getSortOrder()))
                                .map(detailImage -> detailImage.getImageUrl())
                                .toList()
                )
                .build();
    }
}