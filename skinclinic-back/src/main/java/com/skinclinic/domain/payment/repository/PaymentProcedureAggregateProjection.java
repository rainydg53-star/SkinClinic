package com.skinclinic.domain.payment.repository;

public interface PaymentProcedureAggregateProjection {
    Long getProcedureId();
    String getProcedureName();
    Long getTotalAmount();
    Long getTotalCount();
}

