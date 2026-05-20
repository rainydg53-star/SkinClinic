package com.skinclinic.domain.admin.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class AdminDashboardSummaryDto {
    private String period;
    private long memberCount;
    private long paymentCount;
    private long paidCount;
    private long canceledCount;
    private long failedCount;
    private long readyCount;
    private long expiredCount;
    private long paidAmountTotal;
    private long canceledAmountTotal;
    private long yearlySalesTotal;
    private long yearlyMonthlyAverageSales;
    private long monthlySalesTotal;
    private long monthlyNewMembersCount;
    private long weeklySalesTotal;
    private long lastWeeklySalesTotal;
    private double weekOverWeekChangeRate;
    private List<AdminTopProcedureDto> topProceduresByRevenue;
    private List<AdminTopProcedureDto> topProceduresByCount;
    private List<AdminMonthlySalesPointDto> monthlySalesTrend;
    private LocalDateTime generatedAt;
}
