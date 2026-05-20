package com.skinclinic.domain.treatmentrecord.dto;

import com.skinclinic.domain.treatmentrecord.entity.TreatmentRecord;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
public class TreatmentRecordListResponseDto {
    private Long id;
    private String procedureName;
    private LocalDate treatmentDate;
    private String beforeImageUrl;
    private String afterImageUrl;

    public static TreatmentRecordListResponseDto from(TreatmentRecord treatmentRecord) {
        return TreatmentRecordListResponseDto.builder()
                .id(treatmentRecord.getId())
                .procedureName(treatmentRecord.getProcedureName())
                .treatmentDate(treatmentRecord.getTreatmentDate())
                .beforeImageUrl(treatmentRecord.getBeforeImageUrl())
                .afterImageUrl(treatmentRecord.getAfterImageUrl())
                .build();
    }
}
