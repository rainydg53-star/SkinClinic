package com.skinclinic.domain.payment.repository;

public interface PaymentMonthlySalesProjection {
    Integer getMonthValue();
    Long getTotalAmount();
}

