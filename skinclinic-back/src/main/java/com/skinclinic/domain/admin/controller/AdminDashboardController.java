package com.skinclinic.domain.admin.controller;

import com.skinclinic.domain.admin.dto.AdminDashboardSummaryDto;
import com.skinclinic.domain.admin.service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/dashboard")
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    @GetMapping("/summary")
    public AdminDashboardSummaryDto getSummary(
            @RequestParam(defaultValue = "30D") String period,
            @RequestParam(required = false) String month
    ) {
        return adminDashboardService.getSummary(period, month);
    }

    @GetMapping("/statistics/excel")
    public ResponseEntity<byte[]> downloadStatisticsExcel() {
        byte[] fileBytes = adminDashboardService.createStatisticsExcel();
        String fileName = adminDashboardService.createExcelFileName();

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(fileName, StandardCharsets.UTF_8)
                                .build()
                                .toString()
                )
                .body(fileBytes);
    }
}
