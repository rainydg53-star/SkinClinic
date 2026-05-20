package com.skinclinic.domain.admin.service;

import com.skinclinic.domain.admin.dto.AdminPaymentDetailDto;
import com.skinclinic.domain.admin.dto.AdminPaymentListDto;
import com.skinclinic.domain.payment.entity.Payment;
import com.skinclinic.domain.payment.repository.PaymentRepository;
import com.skinclinic.domain.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminPaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentService paymentService;

    @Transactional
    public List<AdminPaymentListDto> getPayments() {
        return getPaymentsByPaidDate(null);
    }

    @Transactional
    public List<AdminPaymentListDto> getPaymentsByPaidDate(LocalDate paidDate) {
        paymentService.expireStaleReadyPayments();

        List<Payment> payments = paidDate == null
                ? paymentRepository.findAll()
                : paymentRepository.findByPaidAtGreaterThanEqualAndPaidAtLessThanOrderByCreatedAtDesc(
                        paidDate.atStartOfDay(),
                        paidDate.plusDays(1).atStartOfDay());

        return payments.stream()
                .sorted(Comparator.comparing(Payment::getCreatedAt).reversed())
                .map(AdminPaymentListDto::from)
                .toList();
    }

    public AdminPaymentDetailDto getPayment(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found."));

        return AdminPaymentDetailDto.from(payment);
    }

    @Transactional
    public AdminPaymentDetailDto refundPayment(Long paymentId) {
        paymentService.refundPaymentByAdmin(paymentId);

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found."));

        return AdminPaymentDetailDto.from(payment);
    }
}
