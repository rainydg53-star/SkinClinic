package com.skinclinic.domain.treatmentrecord.dto;

import com.skinclinic.domain.treatmentrecord.repository.TreatmentRecordMemberSummaryProjection;
import java.time.LocalDate;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TreatmentRecordMemberSummaryResponseDto {
    private Long memberId;
    private String memberName;
    private String loginId;
    private Long latestTreatmentRecordId;
    private String latestProcedureName;
    private LocalDate latestTreatmentDate;
    private long recordCount;

    public static TreatmentRecordMemberSummaryResponseDto from(
            TreatmentRecordMemberSummaryProjection projection,
            Long latestTreatmentRecordId,
            String latestProcedureName
    ) {
        return TreatmentRecordMemberSummaryResponseDto.builder()
                .memberId(projection.getMemberId())
                .memberName(projection.getMemberName())
                .loginId(projection.getLoginId())
                .latestTreatmentRecordId(latestTreatmentRecordId)
                .latestProcedureName(latestProcedureName)
                .latestTreatmentDate(projection.getLatestTreatmentDate())
                .recordCount(projection.getRecordCount() == null ? 0L : projection.getRecordCount())
                .build();
    }
}
