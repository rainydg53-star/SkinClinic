package com.skinclinic.domain.treatmentrecord.dto;

import com.skinclinic.domain.treatmentrecord.entity.TreatmentRecord;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class TreatmentRecordDetailResponseDto {
    private Long id;
    private Long procedureId;
    private String procedureName;
    private LocalDate treatmentDate;
    private String notes;
    private String beforeImageUrl;
    private String afterImageUrl;
    private LocalDateTime createdAt;

    public static TreatmentRecordDetailResponseDto from(TreatmentRecord treatmentRecord) {
        return TreatmentRecordDetailResponseDto.builder()
                .id(treatmentRecord.getId())
                .procedureId(treatmentRecord.getProcedure().getId())
                .procedureName(treatmentRecord.getProcedureName())
                .treatmentDate(treatmentRecord.getTreatmentDate())
                .notes(treatmentRecord.getNotes())
                .beforeImageUrl(treatmentRecord.getBeforeImageUrl())
                .afterImageUrl(treatmentRecord.getAfterImageUrl())
                .createdAt(treatmentRecord.getCreatedAt())
                .build();
    }
}
