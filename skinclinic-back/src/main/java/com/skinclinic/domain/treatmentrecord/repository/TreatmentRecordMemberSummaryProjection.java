package com.skinclinic.domain.treatmentrecord.repository;

import java.time.LocalDate;

public interface TreatmentRecordMemberSummaryProjection {
    Long getMemberId();
    String getMemberName();
    String getLoginId();
    LocalDate getLatestTreatmentDate();
    Long getRecordCount();
}
