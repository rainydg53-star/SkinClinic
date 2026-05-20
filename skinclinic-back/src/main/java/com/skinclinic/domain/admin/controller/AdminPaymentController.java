package com.skinclinic.domain.admin.controller;

import com.skinclinic.domain.admin.dto.AdminPaymentDetailDto;
import com.skinclinic.domain.admin.dto.AdminPaymentListDto;
import com.skinclinic.domain.admin.service.AdminPaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/payments")
public class AdminPaymentController {

    private final AdminPaymentService adminPaymentService;

    @GetMapping
    public List<AdminPaymentListDto> getPayments(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate paidDate
    ) {
        return adminPaymentService.getPaymentsByPaidDate(paidDate);
    }

    @GetMapping("/{paymentId}")
    public AdminPaymentDetailDto getPayment(@PathVariable Long paymentId) {
        return adminPaymentService.getPayment(paymentId);
    }

    @PostMapping("/{paymentId}/refund")
    public AdminPaymentDetailDto refundPayment(@PathVariable Long paymentId) {
        return adminPaymentService.refundPayment(paymentId);
    }
}
