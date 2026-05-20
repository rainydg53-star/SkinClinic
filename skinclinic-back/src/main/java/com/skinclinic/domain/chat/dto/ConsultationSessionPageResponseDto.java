package com.skinclinic.domain.chat.dto;

import com.skinclinic.domain.chat.entity.ConsultationSession;
import lombok.Builder;
import lombok.Getter;
import org.springframework.data.domain.Page;

import java.util.List;

@Getter
@Builder
public class ConsultationSessionPageResponseDto {
    private List<ConsultationSessionResponseDto> content;
    private int page;
    private int size;
    private int totalPages;
    private long totalElements;
    private boolean first;
    private boolean last;
    private boolean hasNext;
    private boolean hasPrevious;

    public static ConsultationSessionPageResponseDto from(Page<ConsultationSession> pageResult) {
        return ConsultationSessionPageResponseDto.builder()
                .content(pageResult.getContent().stream()
                        .map(ConsultationSessionResponseDto::from)
                        .toList())
                .page(pageResult.getNumber())
                .size(pageResult.getSize())
                .totalPages(pageResult.getTotalPages())
                .totalElements(pageResult.getTotalElements())
                .first(pageResult.isFirst())
                .last(pageResult.isLast())
                .hasNext(pageResult.hasNext())
                .hasPrevious(pageResult.hasPrevious())
                .build();
    }
}
