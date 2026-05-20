package com.skinclinic.domain.payment.service;

import com.skinclinic.domain.member.entity.Member;
import com.skinclinic.domain.member.repository.MemberRepository;
import com.skinclinic.domain.notification.dto.NotificationEventTriggerRequest;
import com.skinclinic.domain.notification.enumtype.NotificationType;
import com.skinclinic.domain.notification.service.NotificationService;
import com.skinclinic.domain.payment.dto.KakaoPayApproveRequestDto;
import com.skinclinic.domain.payment.dto.KakaoPayReadyRequestDto;
import com.skinclinic.domain.payment.dto.KakaoPayReadyResponseDto;
import com.skinclinic.domain.payment.dto.PaymentResponseDto;
import com.skinclinic.domain.payment.dto.PortOnePaymentCompleteRequestDto;
import com.skinclinic.domain.payment.dto.PortOnePaymentPrepareRequestDto;
import com.skinclinic.domain.payment.dto.PortOnePaymentPrepareResponseDto;
import com.skinclinic.domain.payment.dto.TestPaymentCreateRequestDto;
import com.skinclinic.domain.payment.entity.Payment;
import com.skinclinic.domain.payment.entity.PaymentStatus;
import com.skinclinic.domain.payment.repository.PaymentRepository;
import com.skinclinic.domain.procedure.entity.Procedure;
import com.skinclinic.domain.procedure.repository.ProcedureRepository;
import com.skinclinic.domain.reservation.entity.Reservation;
import com.skinclinic.domain.reservation.entity.ReservationStatus;
import com.skinclinic.domain.reservation.repository.ReservationRepository;
import com.skinclinic.domain.reservation.service.ReservationPaymentSyncService;
import com.skinclinic.domain.treatmentrecord.repository.TreatmentRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Transactional
public class PaymentService {

    private static final String DEFAULT_TEST_CID = "TC0ONETIME";
    private static final String KAKAO_PAYMENT_METHOD = "KAKAO_PAY";
    private static final String PORTONE_PAYMENT_METHOD = "PORTONE_INICIS_CARD";
    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    private final PaymentRepository paymentRepository;
    private final MemberRepository memberRepository;
    private final ProcedureRepository procedureRepository;
    private final TreatmentRecordRepository treatmentRecordRepository;
    private final ReservationRepository reservationRepository;
    private final ReservationPaymentSyncService reservationPaymentSyncService;
    private final NotificationService notificationService;

    @Value("${app.frontend-url:http://localhost:5174}")
    private String frontendUrl;

    @Value("${kakaopay.secret-key:}")
    private String kakaoPaySecretKey;

    @Value("${kakaopay.cid:" + DEFAULT_TEST_CID + "}")
    private String kakaoPayCid;

    @Value("${kakaopay.base-url:https://open-api.kakaopay.com}")
    private String kakaoPayBaseUrl;

    @Value("${portone.api-secret:}")
    private String portOneApiSecret;

    @Value("${portone.store-id:}")
    private String portOneStoreId;

    @Value("${portone.channel-key:}")
    private String portOneChannelKey;

    @Value("${portone.api-base-url:https://api.portone.io}")
    private String portOneApiBaseUrl;

    @Value("${app.payment.ready-timeout-minutes:30}")
    private long readyTimeoutMinutes;

    public PaymentResponseDto createTestPayment(String loginId, TestPaymentCreateRequestDto requestDto) {
        Member member = memberRepository.findByLoginId(loginId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found."));

        Reservation reservation = requirePayableReservation(member, requestDto.getProcedureId(), null);
        Procedure procedure = reservation.getProcedure();

        LocalDateTime now = LocalDateTime.now();
        String paymentMethod = hasText(requestDto.getPaymentMethod()) ? requestDto.getPaymentMethod() : "TEST_CARD";

        Payment payment = Payment.builder()
                .orderId(createOrderId(now))
                .member(member)
                .procedure(procedure)
                .reservationId(reservation.getId())
                .procedureName(procedure.getName())
                .amount(procedure.getPrice())
                .status(PaymentStatus.PAID)
                .paymentMethod(paymentMethod)
                .paidAt(now)
                .createdAt(now)
                .build();

        paymentRepository.save(payment);
        reservationPaymentSyncService.confirmReservationByPayment(payment);
        return toPaymentResponse(payment);
    }

    public KakaoPayReadyResponseDto createKakaoPayReady(String loginId, KakaoPayReadyRequestDto requestDto) {
        validateKakaoPayConfig();

        Member member = memberRepository.findByLoginId(loginId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found."));

        Reservation reservation = requirePayableReservation(member, requestDto.getProcedureId(), requestDto.getReservationId());
        Procedure procedure = reservation.getProcedure();

        LocalDateTime now = LocalDateTime.now();
        String orderId = createOrderId(now);

        Payment payment = Payment.builder()
                .orderId(orderId)
                .member(member)
                .procedure(procedure)
                .reservationId(reservation.getId())
                .procedureName(procedure.getName())
                .amount(procedure.getPrice())
                .status(PaymentStatus.READY)
                .paymentMethod(KAKAO_PAYMENT_METHOD)
                .createdAt(now)
                .build();

        paymentRepository.save(payment);

        Map<String, Object> readyResponse;

        try {
            readyResponse = createKakaoRestClient()
                    .post()
                    .uri("/online/v1/payment/ready")
                    .body(Map.of(
                            "cid", kakaoPayCid,
                            "partner_order_id", orderId,
                            "partner_user_id", loginId,
                            "item_name", procedure.getName(),
                            "quantity", 1,
                            "total_amount", procedure.getPrice(),
                            "tax_free_amount", 0,
                            "approval_url", frontendUrl + "/payments/kakao/success?orderId=" + orderId,
                            "cancel_url", frontendUrl + "/payments/kakao/cancel?orderId=" + orderId,
                            "fail_url", frontendUrl + "/payments/kakao/fail?orderId=" + orderId
                    ))
                    .retrieve()
                    .body(Map.class);
        } catch (RestClientResponseException e) {
            payment.markFailed();
            throw new IllegalArgumentException(extractKakaoErrorMessage(e, "Failed to prepare KakaoPay payment."));
        }

        if (readyResponse == null || !hasText((String) readyResponse.get("tid"))) {
            payment.markFailed();
            throw new IllegalArgumentException("KakaoPay response did not include a transaction id.");
        }

        payment.updateTid((String) readyResponse.get("tid"));

        String redirectUrl = firstNonBlank(
                (String) readyResponse.get("next_redirect_pc_url"),
                (String) readyResponse.get("next_redirect_mobile_url"),
                (String) readyResponse.get("next_redirect_app_url")
        );

        if (!hasText(redirectUrl)) {
            payment.markFailed();
            throw new IllegalArgumentException("KakaoPay response did not include a redirect URL.");
        }

        return KakaoPayReadyResponseDto.builder()
                .orderId(orderId)
                .redirectUrl(redirectUrl)
                .build();
    }

    public PortOnePaymentPrepareResponseDto preparePortOnePayment(
            String loginId,
            PortOnePaymentPrepareRequestDto requestDto
    ) {
        validatePortOneConfig();

        Member member = memberRepository.findByLoginId(loginId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found."));

        Reservation reservation = requirePayableReservation(member, requestDto.getProcedureId(), requestDto.getReservationId());
        Procedure procedure = reservation.getProcedure();

        LocalDateTime now = LocalDateTime.now();
        String paymentId = createOrderId(now);

        Payment payment = Payment.builder()
                .orderId(paymentId)
                .member(member)
                .procedure(procedure)
                .reservationId(reservation.getId())
                .procedureName(procedure.getName())
                .amount(procedure.getPrice())
                .status(PaymentStatus.READY)
                .paymentMethod(PORTONE_PAYMENT_METHOD)
                .createdAt(now)
                .build();

        paymentRepository.save(payment);

        return PortOnePaymentPrepareResponseDto.builder()
                .storeId(portOneStoreId)
                .channelKey(portOneChannelKey)
                .paymentId(paymentId)
                .orderName(procedure.getName())
                .totalAmount(procedure.getPrice())
                .customerName(member.getName())
                .customerEmail(sanitizeEmail(member.getEmail()))
                .customerPhone(member.getPhone())
                .redirectUrl(frontendUrl + "/payments/portone/redirect")
                .build();
    }

    public PaymentResponseDto completePortOnePayment(String loginId, PortOnePaymentCompleteRequestDto requestDto) {
        validatePortOneConfig();

        Payment payment = paymentRepository.findByOrderIdAndMember_LoginId(requestDto.getPaymentId(), loginId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found."));

        if (payment.getStatus() == PaymentStatus.PAID) {
            return toPaymentResponse(payment);
        }

        Map<String, Object> paymentResponse;

        try {
            paymentResponse = createPortOneRestClient()
                    .get()
                    .uri("/payments/{paymentId}", requestDto.getPaymentId())
                    .retrieve()
                    .body(Map.class);
        } catch (RestClientResponseException e) {
            payment.markFailed();
            throw new IllegalArgumentException(extractPortOneErrorMessage(e, "Failed to verify PortOne payment."));
        }

        if (paymentResponse == null) {
            payment.markFailed();
            throw new IllegalArgumentException("PortOne payment response was empty.");
        }

        int paidAmount = extractPortOneAmount(paymentResponse);
        if (paidAmount != payment.getAmount()) {
            payment.markFailed();
            throw new IllegalArgumentException("Payment amount mismatch.");
        }

        String status = stringValue(paymentResponse.get("status"));
        if (!"PAID".equals(status)) {
            payment.markFailed();
            throw new IllegalArgumentException("Payment is not completed. Current status: " + status);
        }

        payment.updateTid(requestDto.getPaymentId());
        payment.markPaid(LocalDateTime.now());
        reservationPaymentSyncService.confirmReservationByPayment(payment);
        return toPaymentResponse(payment);
    }

    public PaymentResponseDto approveKakaoPayment(String loginId, KakaoPayApproveRequestDto requestDto) {
        validateKakaoPayConfig();

        Payment payment = paymentRepository.findByOrderIdAndMember_LoginId(requestDto.getOrderId(), loginId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found."));

        if (!hasText(payment.getTid())) {
            throw new IllegalArgumentException("KakaoPay transaction id is missing.");
        }

        try {
            createKakaoRestClient()
                    .post()
                    .uri("/online/v1/payment/approve")
                    .body(Map.of(
                            "cid", kakaoPayCid,
                            "tid", payment.getTid(),
                            "partner_order_id", payment.getOrderId(),
                            "partner_user_id", loginId,
                            "pg_token", requestDto.getPgToken()
                    ))
                    .retrieve()
                    .body(Map.class);
        } catch (RestClientResponseException e) {
            payment.markFailed();
            throw new IllegalArgumentException(extractKakaoErrorMessage(e, "Failed to approve KakaoPay payment."));
        }

        payment.markPaid(LocalDateTime.now());
        reservationPaymentSyncService.confirmReservationByPayment(payment);
        return toPaymentResponse(payment);
    }

    public void markPaymentCanceled(String loginId, String orderId) {
        Payment payment = paymentRepository.findByOrderIdAndMember_LoginId(orderId, loginId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found."));
        if (payment.getStatus() == PaymentStatus.READY) {
            payment.markCanceled();
            reservationPaymentSyncService.cancelReservationByPayment(payment);
            notifyCancellationEvent(payment, "\uACB0\uC81C \uCDE8\uC18C \uC548\uB0B4", "\uACB0\uC81C\uAC00 \uCDE8\uC18C\uB418\uC5B4 \uC608\uC57D\uC774 \uCDE8\uC18C\uB418\uC5C8\uC2B5\uB2C8\uB2E4.");
        }
    }

    public void markPaymentFailed(String loginId, String orderId) {
        Payment payment = paymentRepository.findByOrderIdAndMember_LoginId(orderId, loginId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found."));
        if (payment.getStatus() == PaymentStatus.READY) {
            payment.markFailed();
        }
    }

    public PaymentResponseDto reconcilePortOnePayment(String loginId, String paymentId) {
        validatePortOneConfig();

        Payment payment = paymentRepository.findByOrderIdAndMember_LoginId(paymentId, loginId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found."));

        reconcilePortOnePaymentEntity(payment);
        return toPaymentResponse(payment);
    }

    private void reconcilePortOnePaymentEntity(Payment payment) {
        String paymentId = payment.getOrderId();

        if (!PORTONE_PAYMENT_METHOD.equals(payment.getPaymentMethod())) {
            throw new IllegalArgumentException("Only PortOne payments can be reconciled.");
        }

        Map<String, Object> paymentResponse;
        try {
            paymentResponse = createPortOneRestClient()
                    .get()
                    .uri("/payments/{paymentId}", paymentId)
                    .retrieve()
                    .body(Map.class);
        } catch (RestClientResponseException e) {
            throw new IllegalArgumentException(extractPortOneErrorMessage(e, "Failed to reconcile PortOne payment."));
        }

        if (paymentResponse == null) {
            throw new IllegalArgumentException("PortOne payment response was empty.");
        }

        int paidAmount = extractPortOneAmount(paymentResponse);
        if (paidAmount != payment.getAmount()) {
            throw new IllegalArgumentException("Payment amount mismatch.");
        }

        String status = stringValue(paymentResponse.get("status"));
        if ("PAID".equals(status)) {
            payment.updateTid(paymentId);
            if (payment.getStatus() != PaymentStatus.PAID) {
                payment.markPaid(LocalDateTime.now());
                reservationPaymentSyncService.confirmReservationByPayment(payment);
            }
        } else if ("FAILED".equals(status) && payment.getStatus() == PaymentStatus.READY) {
            payment.markFailed();
        } else if ("CANCELED".equals(status) && payment.getStatus() == PaymentStatus.READY) {
            payment.markCanceled();
            reservationPaymentSyncService.cancelReservationByPayment(payment);
            notifyCancellationEvent(payment, "\uACB0\uC81C \uCDE8\uC18C \uC548\uB0B4", "\uACB0\uC81C\uAC00 \uCDE8\uC18C\uB418\uC5B4 \uC608\uC57D\uC774 \uCDE8\uC18C\uB418\uC5C8\uC2B5\uB2C8\uB2E4.");
        }
    }

    public PaymentResponseDto cancelMyPayment(String loginId, Long paymentId) {
        Payment payment = paymentRepository.findByIdAndMember_LoginId(paymentId, loginId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found."));

        cancelPayment(payment, "Canceled by customer", false, true);
        return toPaymentResponse(payment);
    }

    public PaymentResponseDto refundPaymentByAdmin(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found."));

        cancelPayment(payment, "Canceled by administrator", true, true);
        return toPaymentResponse(payment);
    }

    public void cancelLatestPaidPaymentByReservation(Long memberId, Long procedureId) {
        Payment payment = paymentRepository
                .findTopByMember_IdAndProcedure_IdAndStatusOrderByCreatedAtDesc(
                        memberId,
                        procedureId,
                        PaymentStatus.PAID
                )
                .orElse(null);

        if (payment == null) {
            return;
        }

        cancelPayment(payment, "Canceled by reservation cancellation", false, false);
    }

    @Transactional
    public int expireStaleReadyPayments() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(readyTimeoutMinutes);
        List<Payment> staleReadyPayments =
                paymentRepository.findByStatusAndCreatedAtBefore(PaymentStatus.READY, cutoff);

        staleReadyPayments.forEach(Payment::markExpired);
        return staleReadyPayments.size();
    }

    private void cancelPayment(Payment payment, String portOneReason, boolean allowLinkedTreatmentRecord, boolean notifyCancellation) {
        if (payment.getStatus() != PaymentStatus.PAID) {
            throw new IllegalArgumentException("Only completed payments can be canceled.");
        }

        if (!allowLinkedTreatmentRecord && treatmentRecordRepository.existsByPayment_Id(payment.getId())) {
            throw new IllegalArgumentException("Payments linked to a treatment record cannot be canceled.");
        }

        if (KAKAO_PAYMENT_METHOD.equals(payment.getPaymentMethod())) {
            cancelKakaoPayment(payment);
            payment.markCanceled();
            reservationPaymentSyncService.cancelReservationByPayment(payment);
            if (notifyCancellation) {
                notifyCancellationEvent(payment, "\uACB0\uC81C \uCDE8\uC18C \uC548\uB0B4", "\uACB0\uC81C\uAC00 \uCDE8\uC18C\uB418\uC5B4 \uC608\uC57D\uC774 \uCDE8\uC18C\uB418\uC5C8\uC2B5\uB2C8\uB2E4.");
            }
            return;
        }

        if (PORTONE_PAYMENT_METHOD.equals(payment.getPaymentMethod())) {
            cancelPortOnePayment(payment, portOneReason);
            payment.markCanceled();
            reservationPaymentSyncService.cancelReservationByPayment(payment);
            if (notifyCancellation) {
                notifyCancellationEvent(payment, "\uACB0\uC81C \uCDE8\uC18C \uC548\uB0B4", "\uACB0\uC81C\uAC00 \uCDE8\uC18C\uB418\uC5B4 \uC608\uC57D\uC774 \uCDE8\uC18C\uB418\uC5C8\uC2B5\uB2C8\uB2E4.");
            }
            return;
        }

        throw new IllegalArgumentException("Unsupported payment method for cancellation: " + payment.getPaymentMethod());
    }

    private void cancelKakaoPayment(Payment payment) {
        validateKakaoPayConfig();

        if (!hasText(payment.getTid())) {
            throw new IllegalArgumentException("KakaoPay transaction id is missing.");
        }

        try {
            createKakaoRestClient()
                    .post()
                    .uri("/online/v1/payment/cancel")
                    .body(Map.of(
                            "cid", kakaoPayCid,
                            "tid", payment.getTid(),
                            "cancel_amount", payment.getAmount(),
                            "cancel_tax_free_amount", 0
                    ))
                    .retrieve()
                    .body(Map.class);
        } catch (RestClientResponseException e) {
            throw new IllegalArgumentException(extractKakaoErrorMessage(e, "Failed to cancel KakaoPay payment."));
        }
    }

    private void cancelPortOnePayment(Payment payment, String reason) {
        validatePortOneConfig();

        try {
            createPortOneRestClient()
                    .post()
                    .uri(uriBuilder -> uriBuilder
                            .path("/payments/{paymentId}/cancel")
                            .queryParam("storeId", portOneStoreId)
                            .build(payment.getOrderId()))
                    .body(Map.of("reason", reason))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException e) {
            throw new IllegalArgumentException(extractPortOneErrorMessage(e, "Failed to cancel PortOne payment."));
        }
    }

    @Transactional(readOnly = true)
    public List<PaymentResponseDto> getMyPayments(String loginId) {
        return getMyPayments(loginId, null);
    }

    @Transactional(readOnly = true)
    public List<PaymentResponseDto> getMyPayments(String loginId, LocalDate paidDate) {
        List<Payment> payments = paidDate == null
                ? paymentRepository.findByMember_LoginIdOrderByCreatedAtDesc(loginId)
                : paymentRepository.findByMember_LoginIdAndPaidAtGreaterThanEqualAndPaidAtLessThanOrderByCreatedAtDesc(
                        loginId,
                        paidDate.atStartOfDay(),
                        paidDate.plusDays(1).atStartOfDay());

        return payments.stream()
                .map(this::toPaymentResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PaymentResponseDto getMyPaymentDetail(String loginId, Long paymentId) {
        Payment payment = paymentRepository.findByIdAndMember_LoginId(paymentId, loginId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found."));
        return toPaymentResponse(payment);
    }

    private String createOrderId(LocalDateTime now) {
        return "PAY-" + now.format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")) + "-"
                + ThreadLocalRandom.current().nextInt(1000, 10000);
    }

    private void notifyCancellationEvent(Payment payment, String title, String message) {
        String reference = payment.getOrderId() + " / " + payment.getProcedureName();
        notificationService.triggerNotificationEvent(
                new NotificationEventTriggerRequest(
                        payment.getMember().getId(),
                        NotificationType.CANCELLATION,
                        title,
                        message,
                        reference
                )
        );
    }

    private Reservation requirePayableReservation(Member member, Long procedureId, Long reservationId) {
        Long targetReservationId = reservationId;
        if (targetReservationId == null) {
            targetReservationId = reservationRepository
                    .findTopByMember_IdAndProcedure_IdAndStatusOrderByCreatedAtDesc(
                            member.getId(),
                            procedureId,
                            ReservationStatus.PENDING
                    )
                    .map(Reservation::getId)
                    .orElseThrow(() -> new IllegalArgumentException("\uACB0\uC81C \uAC00\uB2A5\uD55C \uC608\uC57D\uC774 \uC5C6\uC2B5\uB2C8\uB2E4."));
        }

        Reservation reservation = reservationRepository.findByIdAndMember_Id(targetReservationId, member.getId())
                .orElseThrow(() -> new IllegalArgumentException("\uC608\uC57D \uC815\uBCF4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."));

        if (!reservation.getProcedure().getId().equals(procedureId)) {
            throw new IllegalArgumentException("\uC608\uC57D\uB41C \uC2DC\uC220\uACFC \uACB0\uC81C \uB300\uC0C1 \uC2DC\uC220\uC774 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
        }

        if (reservation.getStatus() != ReservationStatus.PENDING) {
            throw new IllegalArgumentException("\uACB0\uC81C \uAC00\uB2A5\uD55C \uC608\uC57D \uC0C1\uD0DC\uAC00 \uC544\uB2D9\uB2C8\uB2E4.");
        }

        if (paymentRepository.existsByReservationIdAndStatus(reservation.getId(), PaymentStatus.PAID)) {
            throw new IllegalArgumentException("\uC774\uBBF8 \uACB0\uC81C\uAC00 \uC644\uB8CC\uB41C \uC608\uC57D\uC785\uB2C8\uB2E4.");
        }

        return reservation;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private void validateKakaoPayConfig() {
        if (!hasText(kakaoPaySecretKey)) {
            throw new IllegalArgumentException("KakaoPay secret key is not configured.");
        }
    }

    private void validatePortOneConfig() {
        if (!hasText(portOneApiSecret) || !hasText(portOneStoreId) || !hasText(portOneChannelKey)) {
            throw new IllegalArgumentException("PortOne configuration is incomplete.");
        }
    }

    private RestClient createKakaoRestClient() {
        return RestClient.builder()
                .baseUrl(kakaoPayBaseUrl)
                .defaultHeader("Authorization", "SECRET_KEY " + kakaoPaySecretKey)
                .defaultHeader("Content-Type", "application/json")
                .build();
    }

    private RestClient createPortOneRestClient() {
        return RestClient.builder()
                .baseUrl(portOneApiBaseUrl)
                .defaultHeader("Authorization", "PortOne " + portOneApiSecret)
                .defaultHeader("Content-Type", "application/json")
                .build();
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (hasText(value)) {
                return value;
            }
        }
        return null;
    }

    private String extractKakaoErrorMessage(RestClientResponseException e, String defaultMessage) {
        String responseBody = e.getResponseBodyAsString();

        if (hasText(responseBody)) {
            return defaultMessage + " " + responseBody;
        }

        return defaultMessage;
    }

    @SuppressWarnings("unchecked")
    private int extractPortOneAmount(Map<String, Object> paymentResponse) {
        Object amountObject = paymentResponse.get("amount");
        if (!(amountObject instanceof Map<?, ?> amountMap)) {
            throw new IllegalArgumentException("PortOne amount information is missing.");
        }

        Object totalObject = ((Map<String, Object>) amountMap).get("total");
        if (totalObject instanceof Number number) {
            return number.intValue();
        }

        throw new IllegalArgumentException("PortOne total amount is invalid.");
    }

    private String extractPortOneErrorMessage(RestClientResponseException e, String defaultMessage) {
        String responseBody = e.getResponseBodyAsString();

        if (hasText(responseBody)) {
            return defaultMessage + " " + responseBody;
        }

        return defaultMessage;
    }

    private String stringValue(Object value) {
        return value == null ? "" : value.toString();
    }

    private String sanitizeEmail(String email) {
        if (!hasText(email)) {
            return null;
        }

        String normalized = email.trim().toLowerCase();
        if (!EMAIL_PATTERN.matcher(normalized).matches()) {
            return null;
        }
        return normalized;
    }

    private PaymentResponseDto toPaymentResponse(Payment payment) {
        boolean cancelable = payment.getStatus() == PaymentStatus.PAID
                && (KAKAO_PAYMENT_METHOD.equals(payment.getPaymentMethod())
                || PORTONE_PAYMENT_METHOD.equals(payment.getPaymentMethod()))
                && !treatmentRecordRepository.existsByPayment_Id(payment.getId());

        return PaymentResponseDto.from(payment, cancelable);
    }
}

