package com.skinclinic.domain.treatmentrecord.dto;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TreatmentRecordMemberPageResponseDto {
    private List<TreatmentRecordMemberSummaryResponseDto> content;
    private int page;
    private int size;
    private int totalPages;
    private long totalElements;
}
