package com.skinclinic.domain.reservation.service;

import com.skinclinic.domain.notification.dto.PaymentNotificationCommand;
import com.skinclinic.domain.notification.service.PaymentNotificationService;
import com.skinclinic.domain.payment.entity.Payment;
import com.skinclinic.domain.reservation.entity.Reservation;
import com.skinclinic.domain.reservation.entity.ReservationStatus;
import com.skinclinic.domain.reservation.repository.ReservationRepository;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class ReservationPaymentSyncService {

    private final ReservationRepository reservationRepository;
    private final PaymentNotificationService paymentNotificationService;

    public void confirmReservationByPayment(Payment payment) {
        findLinkedReservation(payment, ReservationStatus.PENDING)
                .ifPresent(reservation -> {
                    ReservationStatus beforeStatus = reservation.getStatus();
                    reservation.markConfirmed();
                    if (beforeStatus != ReservationStatus.CONFIRMED) {
                        notifyPaymentCompleted(reservation, "결제 완료 안내", buildReservationConfirmedMessage(reservation));
                    }
                });
    }

    public void cancelReservationByPayment(Payment payment) {
        findLinkedReservation(payment, null)
                .ifPresent(Reservation::cancel);
    }

    private Optional<Reservation> findLinkedReservation(Payment payment, ReservationStatus requiredStatus) {
        Long reservationId = payment.getReservationId();
        Long memberId = payment.getMember().getId();
        Long procedureId = payment.getProcedure().getId();

        if (reservationId != null) {
            return reservationRepository.findByIdAndMember_Id(reservationId, memberId)
                    .filter(reservation -> reservation.getProcedure().getId().equals(procedureId))
                    .filter(reservation -> requiredStatus == null || reservation.getStatus() == requiredStatus);
        }

        if (requiredStatus != null) {
            return reservationRepository.findTopByMember_IdAndProcedure_IdAndStatusOrderByCreatedAtDesc(
                    memberId,
                    procedureId,
                    requiredStatus
            );
        }

        return reservationRepository.findTopByMember_IdAndProcedure_IdAndStatusInOrderByCreatedAtDesc(
                memberId,
                procedureId,
                List.of(ReservationStatus.PENDING, ReservationStatus.CONFIRMED)
        );
    }

    private String buildReservationConfirmedMessage(Reservation reservation) {
        String memberName = reservation.getMember().getName();
        int month = reservation.getReservationDate().getMonthValue();
        int day = reservation.getReservationDate().getDayOfMonth();
        String dayOfWeek = toKoreanDayOfWeek(reservation.getReservationDate().getDayOfWeek().getValue());
        String timeLabel = toKoreanTimeLabel(reservation.getReservationTime());

        return "안녕하세요 " + memberName + "님\n"
                + "누리클리닉 입니다.\n\n"
                + memberName + "님의 예약은 "
                + month + "월 " + day + "일(" + dayOfWeek + ") "
                + timeLabel + " 입니다.";
    }

    private String toKoreanDayOfWeek(int dayOfWeekValue) {
        return switch (dayOfWeekValue) {
            case 1 -> "월";
            case 2 -> "화";
            case 3 -> "수";
            case 4 -> "목";
            case 5 -> "금";
            case 6 -> "토";
            case 7 -> "일";
            default -> "";
        };
    }

    private String toKoreanTimeLabel(LocalTime time) {
        int hour = time.getHour();
        int minute = time.getMinute();
        String ampm = hour < 12 ? "오전" : "오후";
        int displayHour = hour % 12 == 0 ? 12 : hour % 12;
        return ampm + " " + displayHour + "시 " + String.format("%02d", minute) + "분";
    }

    private void notifyPaymentCompleted(Reservation reservation, String title, String message) {
        String reference = reservation.getReservationDate() + " " + reservation.getReservationTime()
                + " / " + reservation.getProcedure().getName();

        paymentNotificationService.notifyPaymentCompleted(new PaymentNotificationCommand(
                reservation.getMember().getId(),
                reference,
                title,
                message
        ));
    }
}