package com.skinclinic.domain.admin.service;

import com.skinclinic.domain.admin.dto.AdminDashboardSummaryDto;
import com.skinclinic.domain.admin.dto.AdminMonthlySalesPointDto;
import com.skinclinic.domain.admin.dto.AdminTopProcedureDto;
import com.skinclinic.domain.member.repository.MemberRepository;
import com.skinclinic.domain.payment.entity.Payment;
import com.skinclinic.domain.payment.repository.PaymentMonthlySalesProjection;
import com.skinclinic.domain.payment.entity.PaymentStatus;
import com.skinclinic.domain.payment.repository.PaymentProcedureAggregateProjection;
import com.skinclinic.domain.payment.repository.PaymentRepository;
import com.skinclinic.domain.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.VerticalAlignment;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.IntStream;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminDashboardService {

    private static final DateTimeFormatter EXCEL_DATE_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final MemberRepository memberRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentService paymentService;

    @Transactional
    public AdminDashboardSummaryDto getSummary(String periodRaw, String monthRaw) {
        paymentService.expireStaleReadyPayments();
        DashboardPeriod period = DashboardPeriod.from(periodRaw);
        return buildSummary(period, monthRaw);
    }

    @Transactional
    public byte[] createStatisticsExcel() {
        paymentService.expireStaleReadyPayments();
        AdminDashboardSummaryDto summary = buildSummary(DashboardPeriod.ALL, null);
        List<Payment> payments = paymentRepository.findAllByOrderByCreatedAtDesc();

        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);

            CellStyle centeredStyle = workbook.createCellStyle();
            centeredStyle.setAlignment(HorizontalAlignment.CENTER);
            centeredStyle.setVerticalAlignment(VerticalAlignment.CENTER);

            Sheet summarySheet = workbook.createSheet("Dashboard Summary");
            int rowIndex = 0;
            rowIndex = writeSummaryRow(summarySheet, rowIndex, "생성 시각", formatDateTime(summary.getGeneratedAt()), headerStyle, centeredStyle);
            rowIndex = writeSummaryRow(summarySheet, rowIndex, "조회 기간", summary.getPeriod(), headerStyle, centeredStyle);
            rowIndex = writeSummaryRow(summarySheet, rowIndex, "전체 회원 수", String.valueOf(summary.getMemberCount()), headerStyle, centeredStyle);
            rowIndex = writeSummaryRow(summarySheet, rowIndex, "전체 결제 건수", String.valueOf(summary.getPaymentCount()), headerStyle, centeredStyle);
            rowIndex = writeSummaryRow(summarySheet, rowIndex, "결제 완료 건수", String.valueOf(summary.getPaidCount()), headerStyle, centeredStyle);
            rowIndex = writeSummaryRow(summarySheet, rowIndex, "결제 취소 건수", String.valueOf(summary.getCanceledCount()), headerStyle, centeredStyle);
            rowIndex = writeSummaryRow(summarySheet, rowIndex, "결제 실패 건수", String.valueOf(summary.getFailedCount()), headerStyle, centeredStyle);
            rowIndex = writeSummaryRow(summarySheet, rowIndex, "결제 대기 건수", String.valueOf(summary.getReadyCount()), headerStyle, centeredStyle);
            rowIndex = writeSummaryRow(summarySheet, rowIndex, "결제 만료 건수", String.valueOf(summary.getExpiredCount()), headerStyle, centeredStyle);
            rowIndex = writeSummaryRow(summarySheet, rowIndex, "결제 완료 금액 합계", String.valueOf(summary.getPaidAmountTotal()), headerStyle, centeredStyle);
            rowIndex = writeSummaryRow(summarySheet, rowIndex, "결제 취소 금액 합계", String.valueOf(summary.getCanceledAmountTotal()), headerStyle, centeredStyle);
            rowIndex = writeSummaryRow(summarySheet, rowIndex, "이번년도 총 매출", String.valueOf(summary.getYearlySalesTotal()), headerStyle, centeredStyle);
            rowIndex = writeSummaryRow(summarySheet, rowIndex, "이번년도 월평균 매출", String.valueOf(summary.getYearlyMonthlyAverageSales()), headerStyle, centeredStyle);
            rowIndex = writeSummaryRow(summarySheet, rowIndex, "이번달 총 매출", String.valueOf(summary.getMonthlySalesTotal()), headerStyle, centeredStyle);
            rowIndex = writeSummaryRow(summarySheet, rowIndex, "이번달 신규 회원가입자 수", String.valueOf(summary.getMonthlyNewMembersCount()), headerStyle, centeredStyle);
            rowIndex = writeSummaryRow(summarySheet, rowIndex, "이번주 총 매출", String.valueOf(summary.getWeeklySalesTotal()), headerStyle, centeredStyle);
            rowIndex = writeSummaryRow(summarySheet, rowIndex, "저번주 총 매출", String.valueOf(summary.getLastWeeklySalesTotal()), headerStyle, centeredStyle);
            writeSummaryRow(
                    summarySheet,
                    rowIndex,
                    "저번주 대비 증감률(%)",
                    String.format(Locale.US, "%.2f", summary.getWeekOverWeekChangeRate()),
                    headerStyle,
                    centeredStyle
            );

            summarySheet.autoSizeColumn(0);
            summarySheet.autoSizeColumn(1);
            applyMinColumnWidth(summarySheet, 0, 22);
            applyMinColumnWidth(summarySheet, 1, 20);

            Sheet paymentSheet = workbook.createSheet("Payments");
            Row header = paymentSheet.createRow(0);
            String[] headers = {"ID", "주문번호", "회원 아이디", "회원 이름", "시술명", "결제수단", "상태", "금액", "결제시각", "생성시각"};
            for (int i = 0; i < headers.length; i++) {
                header.createCell(i).setCellValue(headers[i]);
                header.getCell(i).setCellStyle(headerStyle);
            }

            int paymentRow = 1;
            for (Payment payment : payments) {
                Row row = paymentSheet.createRow(paymentRow++);
                row.createCell(0).setCellValue(payment.getId());
                row.createCell(1).setCellValue(payment.getOrderId());
                row.createCell(2).setCellValue(payment.getMember().getLoginId());
                row.createCell(3).setCellValue(payment.getMember().getName());
                row.createCell(4).setCellValue(payment.getProcedureName());
                row.createCell(5).setCellValue(payment.getPaymentMethod());
                row.createCell(6).setCellValue(payment.getStatus().name());
                row.createCell(7).setCellValue(payment.getAmount());
                row.createCell(8).setCellValue(formatDateTime(payment.getPaidAt()));
                row.createCell(9).setCellValue(formatDateTime(payment.getCreatedAt()));
                for (int i = 0; i <= 9; i++) {
                    row.getCell(i).setCellStyle(centeredStyle);
                }
            }

            for (int i = 0; i < headers.length; i++) {
                paymentSheet.autoSizeColumn(i);
            }
            applyMinColumnWidth(paymentSheet, 0, 10);
            applyMinColumnWidth(paymentSheet, 1, 24);
            applyMinColumnWidth(paymentSheet, 2, 16);
            applyMinColumnWidth(paymentSheet, 3, 14);
            applyMinColumnWidth(paymentSheet, 4, 16);
            applyMinColumnWidth(paymentSheet, 5, 18);
            applyMinColumnWidth(paymentSheet, 6, 12);
            applyMinColumnWidth(paymentSheet, 7, 12);
            applyMinColumnWidth(paymentSheet, 8, 18);
            applyMinColumnWidth(paymentSheet, 9, 18);

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("엑셀 파일 생성에 실패했습니다.", e);
        }
    }

    public String createExcelFileName() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"));
        return "누리클리닉-" + timestamp + ".xlsx";
    }

    private AdminDashboardSummaryDto buildSummary(DashboardPeriod period, String monthRaw) {
        LocalDateTime now = LocalDateTime.now();
        PeriodWindow periodWindow = resolvePeriodWindow(period, monthRaw, now);
        LocalDateTime filterFrom = periodWindow.from();
        LocalDateTime filterTo = periodWindow.to();

        long memberCount = memberRepository.countByDeletedFalse();

        long paymentCount;
        long paidCount;
        long canceledCount;
        long failedCount;
        long readyCount;
        long expiredCount;

        if (period == DashboardPeriod.ALL) {
            paymentCount = paymentRepository.count();
            paidCount = paymentRepository.countByStatus(PaymentStatus.PAID);
            canceledCount = paymentRepository.countByStatus(PaymentStatus.CANCELED);
            failedCount = paymentRepository.countByStatus(PaymentStatus.FAILED);
            readyCount = paymentRepository.countByStatus(PaymentStatus.READY);
            expiredCount = paymentRepository.countByStatus(PaymentStatus.EXPIRED);
        } else {
            paymentCount = paymentRepository.countByCreatedAtBetween(filterFrom, filterTo);
            paidCount = paymentRepository.countByStatusAndCreatedAtBetween(PaymentStatus.PAID, filterFrom, filterTo);
            canceledCount = paymentRepository.countByStatusAndCreatedAtBetween(PaymentStatus.CANCELED, filterFrom, filterTo);
            failedCount = paymentRepository.countByStatusAndCreatedAtBetween(PaymentStatus.FAILED, filterFrom, filterTo);
            readyCount = paymentRepository.countByStatusAndCreatedAtBetween(PaymentStatus.READY, filterFrom, filterTo);
            expiredCount = paymentRepository.countByStatusAndCreatedAtBetween(PaymentStatus.EXPIRED, filterFrom, filterTo);
        }

        long paidAmountTotal = period == DashboardPeriod.ALL
                ? nullSafe(paymentRepository.sumAmountByStatus(PaymentStatus.PAID))
                : nullSafe(paymentRepository.sumAmountByStatusAndPaidAtBetween(PaymentStatus.PAID, filterFrom, filterTo));

        long canceledAmountTotal = period == DashboardPeriod.ALL
                ? nullSafe(paymentRepository.sumAmountByStatus(PaymentStatus.CANCELED))
                : nullSafe(paymentRepository.sumAmountByStatusAndPaidAtBetween(PaymentStatus.CANCELED, filterFrom, filterTo));

        LocalDate today = now.toLocalDate();

        LocalDateTime yearStart = today.withDayOfYear(1).atStartOfDay();
        LocalDateTime yearEnd = yearStart.plusYears(1);

        LocalDateTime monthStart = today.withDayOfMonth(1).atStartOfDay();
        LocalDateTime monthEnd = monthStart.plusMonths(1);

        LocalDate weekStartDate = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDateTime weekStart = LocalDateTime.of(weekStartDate, LocalTime.MIN);
        LocalDateTime weekEnd = weekStart.plusWeeks(1);

        LocalDateTime lastWeekStart = weekStart.minusWeeks(1);
        LocalDateTime lastWeekEnd = weekStart;

        long yearlySalesTotal = nullSafe(
                paymentRepository.sumAmountByStatusAndPaidAtBetween(PaymentStatus.PAID, yearStart, yearEnd)
        );
        long monthlySalesTotal = nullSafe(
                paymentRepository.sumAmountByStatusAndPaidAtBetween(PaymentStatus.PAID, monthStart, monthEnd)
        );
        long monthlyNewMembersCount = memberRepository.countByDeletedFalseAndCreatedAtBetween(monthStart, monthEnd);
        long weeklySalesTotal = nullSafe(
                paymentRepository.sumAmountByStatusAndPaidAtBetween(PaymentStatus.PAID, weekStart, weekEnd)
        );
        long lastWeeklySalesTotal = nullSafe(
                paymentRepository.sumAmountByStatusAndPaidAtBetween(PaymentStatus.PAID, lastWeekStart, lastWeekEnd)
        );

        double weekOverWeekChangeRate = calculateChangeRate(weeklySalesTotal, lastWeeklySalesTotal);
        int currentMonth = now.getMonthValue();
        long yearlyMonthlyAverageSales = currentMonth == 0 ? 0 : Math.round((double) yearlySalesTotal / currentMonth);

        List<PaymentMonthlySalesProjection> monthlySalesRows = paymentRepository.findMonthlySalesByPaidAtBetween(
                PaymentStatus.PAID,
                yearStart,
                yearEnd
        );
        Map<Integer, Long> monthlySalesMap = monthlySalesRows.stream()
                .collect(Collectors.toMap(PaymentMonthlySalesProjection::getMonthValue, row -> nullSafe(row.getTotalAmount())));
        List<AdminMonthlySalesPointDto> monthlySalesTrend = IntStream.rangeClosed(1, 12)
                .mapToObj(month -> AdminMonthlySalesPointDto.builder()
                        .month(month)
                        .salesAmount(monthlySalesMap.getOrDefault(month, 0L))
                        .build())
                .toList();

        List<AdminTopProcedureDto> topProceduresByRevenue = mapTopProcedures(
                paymentRepository.findTopProceduresByRevenue(
                        PaymentStatus.PAID,
                        filterFrom,
                        filterTo,
                        PageRequest.of(0, 6)
                )
        );
        List<AdminTopProcedureDto> topProceduresByCount = mapTopProcedures(
                paymentRepository.findTopProceduresByCount(
                        PaymentStatus.PAID,
                        filterFrom,
                        filterTo,
                        PageRequest.of(0, 6)
                )
        );

        return AdminDashboardSummaryDto.builder()
                .period(periodWindow.label())
                .memberCount(memberCount)
                .paymentCount(paymentCount)
                .paidCount(paidCount)
                .canceledCount(canceledCount)
                .failedCount(failedCount)
                .readyCount(readyCount)
                .expiredCount(expiredCount)
                .paidAmountTotal(paidAmountTotal)
                .canceledAmountTotal(canceledAmountTotal)
                .yearlySalesTotal(yearlySalesTotal)
                .yearlyMonthlyAverageSales(yearlyMonthlyAverageSales)
                .monthlySalesTotal(monthlySalesTotal)
                .monthlyNewMembersCount(monthlyNewMembersCount)
                .weeklySalesTotal(weeklySalesTotal)
                .lastWeeklySalesTotal(lastWeeklySalesTotal)
                .weekOverWeekChangeRate(weekOverWeekChangeRate)
                .topProceduresByRevenue(topProceduresByRevenue)
                .topProceduresByCount(topProceduresByCount)
                .monthlySalesTrend(monthlySalesTrend)
                .generatedAt(now)
                .build();
    }

    private PeriodWindow resolvePeriodWindow(DashboardPeriod period, String monthRaw, LocalDateTime now) {
        if (period == DashboardPeriod.ALL) {
            return new PeriodWindow(
                    LocalDateTime.of(1970, 1, 1, 0, 0),
                    now,
                    period.label()
            );
        }

        if (period == DashboardPeriod.MONTHLY) {
            YearMonth yearMonth = parseYearMonthOrCurrent(monthRaw, now);
            LocalDateTime from = yearMonth.atDay(1).atStartOfDay();
            LocalDateTime to = from.plusMonths(1);
            String label = String.format(Locale.KOREA, "%d년 %d월", yearMonth.getYear(), yearMonth.getMonthValue());
            return new PeriodWindow(from, to, label);
        }

        return new PeriodWindow(
                period.start(now),
                now,
                period.label()
        );
    }

    private YearMonth parseYearMonthOrCurrent(String monthRaw, LocalDateTime now) {
        if (monthRaw == null || monthRaw.isBlank()) {
            return YearMonth.from(now);
        }
        try {
            return YearMonth.parse(monthRaw.trim());
        } catch (DateTimeParseException ignored) {
            return YearMonth.from(now);
        }
    }

    private long nullSafe(Long value) {
        return value == null ? 0L : value;
    }

    private double calculateChangeRate(long currentValue, long previousValue) {
        if (previousValue == 0L) {
            return currentValue == 0L ? 0.0 : 100.0;
        }
        return ((double) (currentValue - previousValue) / previousValue) * 100.0;
    }

    private int writeSummaryRow(
            Sheet sheet,
            int rowIndex,
            String label,
            String value,
            CellStyle labelStyle,
            CellStyle valueStyle
    ) {
        Row row = sheet.createRow(rowIndex);
        row.createCell(0).setCellValue(label);
        row.createCell(1).setCellValue(value);
        row.getCell(0).setCellStyle(labelStyle);
        row.getCell(1).setCellStyle(valueStyle);
        return rowIndex + 1;
    }

    private String formatDateTime(LocalDateTime dateTime) {
        if (dateTime == null) {
            return "";
        }
        return dateTime.format(EXCEL_DATE_TIME_FORMATTER);
    }

    private void applyMinColumnWidth(Sheet sheet, int columnIndex, int minChars) {
        int minWidth = minChars * 256;
        if (sheet.getColumnWidth(columnIndex) < minWidth) {
            sheet.setColumnWidth(columnIndex, minWidth);
        }
    }

    private List<AdminTopProcedureDto> mapTopProcedures(List<PaymentProcedureAggregateProjection> rows) {
        return IntStream.range(0, rows.size())
                .mapToObj(index -> {
                    PaymentProcedureAggregateProjection row = rows.get(index);
                    return AdminTopProcedureDto.builder()
                            .rank(index + 1)
                            .procedureId(row.getProcedureId())
                            .procedureName(row.getProcedureName())
                            .totalAmount(nullSafe(row.getTotalAmount()))
                            .totalCount(nullSafe(row.getTotalCount()))
                            .build();
                })
                .toList();
    }

    private enum DashboardPeriod {
        TODAY("오늘", 0),
        DAY_7("최근 7일", 6),
        DAY_30("최근 30일", 29),
        MONTHLY("월별 조회", -1),
        ALL("전체", -1);

        private final String label;
        private final int dayOffset;

        DashboardPeriod(String label, int dayOffset) {
            this.label = label;
            this.dayOffset = dayOffset;
        }

        static DashboardPeriod from(String value) {
            if (value == null || value.isBlank()) {
                return DAY_30;
            }
            return switch (value.trim().toUpperCase(Locale.ROOT)) {
                case "TODAY" -> TODAY;
                case "7D", "DAY_7", "WEEK" -> DAY_7;
                case "30D", "DAY_30", "MONTH" -> DAY_30;
                case "MONTHLY", "MONTH_BY_MONTH" -> MONTHLY;
                case "ALL" -> ALL;
                default -> DAY_30;
            };
        }

        String label() {
            return label;
        }

        LocalDateTime start(LocalDateTime now) {
            if (this == ALL) {
                return LocalDateTime.of(1970, 1, 1, 0, 0);
            }
            if (this == MONTHLY) {
                return now.toLocalDate().withDayOfMonth(1).atStartOfDay();
            }
            return now.toLocalDate().minusDays(dayOffset).atStartOfDay();
        }
    }

    private record PeriodWindow(LocalDateTime from, LocalDateTime to, String label) {}
}

