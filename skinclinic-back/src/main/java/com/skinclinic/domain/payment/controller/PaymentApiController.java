package com.skinclinic.domain.payment.controller;

import com.skinclinic.domain.payment.dto.KakaoPayApproveRequestDto;
import com.skinclinic.domain.payment.dto.KakaoPayReadyRequestDto;
import com.skinclinic.domain.payment.dto.KakaoPayReadyResponseDto;
import com.skinclinic.domain.payment.dto.PaymentResponseDto;
import com.skinclinic.domain.payment.dto.PortOnePaymentCompleteRequestDto;
import com.skinclinic.domain.payment.dto.PortOnePaymentPrepareRequestDto;
import com.skinclinic.domain.payment.dto.PortOnePaymentPrepareResponseDto;
import com.skinclinic.domain.payment.dto.TestPaymentCreateRequestDto;
import com.skinclinic.domain.payment.service.PaymentService;
import com.skinclinic.global.auth.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/payments")
public class PaymentApiController {

    private final PaymentService paymentService;

    @PostMapping("/test-checkout")
    public ResponseEntity<PaymentResponseDto> createTestPayment(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody TestPaymentCreateRequestDto requestDto
    ) {
        return ResponseEntity.ok(paymentService.createTestPayment(userDetails.getUsername(), requestDto));
    }

    @PostMapping("/kakao/ready")
    public ResponseEntity<KakaoPayReadyResponseDto> createKakaoPayReady(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody KakaoPayReadyRequestDto requestDto
    ) {
        return ResponseEntity.ok(paymentService.createKakaoPayReady(userDetails.getUsername(), requestDto));
    }

    @PostMapping("/portone/prepare")
    public ResponseEntity<PortOnePaymentPrepareResponseDto> preparePortOnePayment(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody PortOnePaymentPrepareRequestDto requestDto
    ) {
        return ResponseEntity.ok(paymentService.preparePortOnePayment(userDetails.getUsername(), requestDto));
    }

    @PostMapping("/portone/complete")
    public ResponseEntity<PaymentResponseDto> completePortOnePayment(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody PortOnePaymentCompleteRequestDto requestDto
    ) {
        return ResponseEntity.ok(paymentService.completePortOnePayment(userDetails.getUsername(), requestDto));
    }

    @PostMapping("/kakao/approve")
    public ResponseEntity<PaymentResponseDto> approveKakaoPayment(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody KakaoPayApproveRequestDto requestDto
    ) {
        return ResponseEntity.ok(paymentService.approveKakaoPayment(userDetails.getUsername(), requestDto));
    }

    @PostMapping("/kakao/cancel")
    public ResponseEntity<?> markKakaoPaymentCanceled(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam String orderId
    ) {
        paymentService.markPaymentCanceled(userDetails.getUsername(), orderId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/kakao/fail")
    public ResponseEntity<?> markKakaoPaymentFailed(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam String orderId
    ) {
        paymentService.markPaymentFailed(userDetails.getUsername(), orderId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/portone/cancel")
    public ResponseEntity<?> markPortOnePaymentCanceled(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam String paymentId
    ) {
        paymentService.markPaymentCanceled(userDetails.getUsername(), paymentId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/portone/fail")
    public ResponseEntity<?> markPortOnePaymentFailed(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam String paymentId
    ) {
        paymentService.markPaymentFailed(userDetails.getUsername(), paymentId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/portone/reconcile")
    public ResponseEntity<PaymentResponseDto> reconcilePortOnePayment(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam String paymentId
    ) {
        return ResponseEntity.ok(
                paymentService.reconcilePortOnePayment(userDetails.getUsername(), paymentId)
        );
    }

    @GetMapping("/me")
    public ResponseEntity<List<PaymentResponseDto>> getMyPayments(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate paidDate
    ) {
        return ResponseEntity.ok(paymentService.getMyPayments(userDetails.getUsername(), paidDate));
    }

    @GetMapping("/{paymentId}")
    public ResponseEntity<PaymentResponseDto> getMyPaymentDetail(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long paymentId
    ) {
        return ResponseEntity.ok(paymentService.getMyPaymentDetail(userDetails.getUsername(), paymentId));
    }

    @PostMapping("/{paymentId}/cancel")
    public ResponseEntity<PaymentResponseDto> cancelMyPayment(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long paymentId
    ) {
        return ResponseEntity.ok(paymentService.cancelMyPayment(userDetails.getUsername(), paymentId));
    }
}
