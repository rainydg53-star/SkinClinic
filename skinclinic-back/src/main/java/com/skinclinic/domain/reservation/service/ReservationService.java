package com.skinclinic.domain.reservation.service;

import com.skinclinic.domain.member.entity.Member;
import com.skinclinic.domain.member.repository.MemberRepository;
import com.skinclinic.domain.notification.dto.ReservationNotificationCommand;
import com.skinclinic.domain.notification.service.ReservationNotificationService;
import com.skinclinic.domain.payment.entity.PaymentStatus;
import com.skinclinic.domain.payment.repository.PaymentRepository;
import com.skinclinic.domain.payment.service.PaymentService;
import com.skinclinic.domain.procedure.entity.Procedure;
import com.skinclinic.domain.procedure.repository.ProcedureRepository;
import com.skinclinic.domain.reservation.dto.ReservationAvailabilityResponse;
import com.skinclinic.domain.reservation.dto.ReservationClosedDayResponse;
import com.skinclinic.domain.reservation.dto.ReservationCreateRequest;
import com.skinclinic.domain.reservation.dto.ReservationStatsResponse;
import com.skinclinic.domain.reservation.entity.Reservation;
import com.skinclinic.domain.reservation.entity.ReservationClosedDay;
import com.skinclinic.domain.reservation.entity.ReservationStatus;
import com.skinclinic.domain.reservation.repository.ReservationClosedDayRepository;
import com.skinclinic.domain.reservation.repository.ReservationRepository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class ReservationService {

    private static final int MAX_RESERVATIONS_PER_SLOT = 3;

    private final ReservationRepository reservationRepository;
    private final ReservationClosedDayRepository reservationClosedDayRepository;
    private final ProcedureRepository procedureRepository;
    private final MemberRepository memberRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentService paymentService;
    private final ReservationNotificationService reservationNotificationService;

    public Reservation create(Long memberId, ReservationCreateRequest request) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("회원 정보를 찾을 수 없습니다."));

        Procedure procedure = procedureRepository.findById(request.procedureId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 시술입니다."));

        if (reservationClosedDayRepository.existsByClosedDate(request.reservationDate())) {
            throw new IllegalStateException("해당 날짜는 휴진일이라 예약할 수 없습니다.");
        }

        long reservedCount = reservationRepository.countByReservationDateAndReservationTimeAndStatusIn(
                request.reservationDate(),
                request.reservationTime(),
                List.of(ReservationStatus.PENDING, ReservationStatus.CONFIRMED)
        );

        if (reservedCount >= MAX_RESERVATIONS_PER_SLOT) {
            throw new IllegalStateException("해당 시간은 예약 가능 인원이 모두 찼습니다.");
        }

        Reservation reservation = Reservation.create(member, procedure, request.reservationDate(), request.reservationTime());
        Reservation savedReservation = reservationRepository.save(reservation);
        notifyReservationEvent(
                savedReservation,
                "예약 요청 안내",
                "예약이 접수되었습니다. 결제를 완료하면 예약이 확정됩니다."
        );
        return savedReservation;
    }

    @Transactional(readOnly = true)
    public List<Reservation> getMyReservations(Long memberId) {
        return reservationRepository.findByMember_IdOrderByReservationDateDescReservationTimeDesc(memberId);
    }

    @Transactional(readOnly = true)
    public Reservation getMyReservationDetail(Long memberId, Long reservationId) {
        return reservationRepository.findByIdAndMember_Id(reservationId, memberId)
                .orElseThrow(() -> new IllegalArgumentException("예약을 찾을 수 없습니다."));
    }

    public void cancelMyReservation(Long memberId, Long reservationId) {
        Reservation reservation = getMyReservationDetail(memberId, reservationId);
        ReservationStatus beforeStatus = reservation.getStatus();
        boolean shouldCancelPayment = beforeStatus == ReservationStatus.CONFIRMED;
        reservation.cancel();

        if (beforeStatus == ReservationStatus.CANCELED) {
            return;
        }

        if (shouldCancelPayment) {
            paymentService.cancelLatestPaidPaymentByReservation(
                    reservation.getMember().getId(),
                    reservation.getProcedure().getId()
            );
            notifyReservationCancellationEvent(
                    reservation,
                    "예약 취소 안내",
                    "예약이 취소되어 결제가 취소되었습니다."
            );
            return;
        }

        notifyReservationCancellationEvent(
                reservation,
                "예약 요청 취소 안내",
                "예약 요청 접수가 취소되었습니다."
        );
    }

    @Transactional(readOnly = true)
    public Reservation getReservationDetail(Long reservationId) {
        return reservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("예약을 찾을 수 없습니다."));
    }

    @Transactional(readOnly = true)
    public List<Reservation> getReservationsByDate(LocalDate date) {
        return reservationRepository.findByReservationDateOrderByReservationTimeAsc(date);
    }

    @Transactional(readOnly = true)
    public List<Reservation> getAllReservations() {
        return reservationRepository.findAllByOrderByReservationDateDescReservationTimeDesc();
    }

    @Transactional(readOnly = true)
    public ReservationStatsResponse getStats(LocalDate date) {
        long todayCount = reservationRepository.countByReservationDateAndStatusNot(date, ReservationStatus.CANCELED);
        long totalCount = reservationRepository.count();
        return new ReservationStatsResponse(date, todayCount, totalCount);
    }

    public void updateStatus(Long reservationId, ReservationStatus status) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("예약을 찾을 수 없습니다."));

        if (status == ReservationStatus.CANCELED) {
            ReservationStatus beforeStatus = reservation.getStatus();
            boolean shouldCancelPayment = beforeStatus == ReservationStatus.CONFIRMED;
            reservation.cancel();

            if (beforeStatus != ReservationStatus.CANCELED && shouldCancelPayment) {
                paymentService.cancelLatestPaidPaymentByReservation(
                        reservation.getMember().getId(),
                        reservation.getProcedure().getId()
                );
                notifyReservationCancellationEvent(
                        reservation,
                        "예약 취소 안내",
                        "예약이 취소되어 결제가 취소되었습니다."
                );
            }
            return;
        }

        if (status == ReservationStatus.COMPLETED) {
            boolean hasPaidPayment = paymentRepository.existsByMember_IdAndProcedure_IdAndStatus(
                    reservation.getMember().getId(),
                    reservation.getProcedure().getId(),
                    PaymentStatus.PAID
            );
            if (!hasPaidPayment) {
                throw new IllegalStateException("결제 완료된 회원만 시술 완료 처리할 수 있습니다.");
            }
            reservation.markCompleted();
            return;
        }

        if (status == ReservationStatus.CONFIRMED) {
            reservation.markConfirmed();
            return;
        }

        if (status == ReservationStatus.PENDING) {
            throw new IllegalArgumentException("예약중 상태 변경은 결제 프로세스에서만 처리합니다.");
        }
    }

    @Transactional(readOnly = true)
    public ReservationAvailabilityResponse getAvailability(LocalDate date) {
        LocalTime open = LocalTime.of(10, 0);
        LocalTime close = LocalTime.of(19, 0);
        int slotMinutes = 30;
        boolean closedDay = reservationClosedDayRepository.existsByClosedDate(date);

        List<Reservation> activeReservations = reservationRepository.findByReservationDateAndStatusIn(
                date,
                List.of(ReservationStatus.PENDING, ReservationStatus.CONFIRMED)
        );

        Map<LocalTime, Integer> reservedCountByTime = new HashMap<>();
        for (Reservation reservation : activeReservations) {
            LocalTime time = reservation.getReservationTime();
            reservedCountByTime.put(time, reservedCountByTime.getOrDefault(time, 0) + 1);
        }

        List<ReservationAvailabilityResponse.Slot> slots = new ArrayList<>();
        for (LocalTime time = open; time.isBefore(close); time = time.plusMinutes(slotMinutes)) {
            int reservedCount = reservedCountByTime.getOrDefault(time, 0);
            int remainingCount = Math.max(0, MAX_RESERVATIONS_PER_SLOT - reservedCount);
            boolean available = !closedDay && remainingCount > 0;
            slots.add(new ReservationAvailabilityResponse.Slot(time, available, reservedCount, remainingCount));
        }

        return new ReservationAvailabilityResponse(
                date,
                open,
                close,
                slotMinutes,
                MAX_RESERVATIONS_PER_SLOT,
                closedDay,
                slots
        );
    }

    public void addClosedDay(LocalDate date) {
        if (reservationClosedDayRepository.existsByClosedDate(date)) {
            return;
        }
        reservationClosedDayRepository.save(new ReservationClosedDay(date));
    }

    public void removeClosedDay(LocalDate date) {
        reservationClosedDayRepository.findByClosedDate(date)
                .ifPresent(reservationClosedDayRepository::delete);
    }

    @Transactional(readOnly = true)
    public List<ReservationClosedDayResponse> getClosedDays(LocalDate from, LocalDate to) {
        return reservationClosedDayRepository.findByClosedDateBetweenOrderByClosedDateAsc(from, to)
                .stream()
                .map(item -> new ReservationClosedDayResponse(item.getClosedDate()))
                .toList();
    }

    private void notifyReservationEvent(Reservation reservation, String title, String message) {
        notifyReservationByType(reservation, title, message, false);
    }

    private void notifyReservationCancellationEvent(Reservation reservation, String title, String message) {
        notifyReservationByType(reservation, title, message, true);
    }

    private void notifyReservationByType(Reservation reservation, String title, String message, boolean cancellation) {
        try {
            String reference = reservation.getReservationDate() + " " + reservation.getReservationTime()
                    + " / " + reservation.getProcedure().getName();

            ReservationNotificationCommand command = new ReservationNotificationCommand(
                    reservation.getMember().getId(),
                    reference,
                    title,
                    message
            );

            if (cancellation) {
                reservationNotificationService.notifyReservationCancellationEvent(command);
            } else {
                reservationNotificationService.notifyReservationEvent(command);
            }
        } catch (Exception exception) {
            log.warn(
                    "예약 알림 발송 실패. reservationId={}, memberId={}, cause={}",
                    reservation.getId(),
                    reservation.getMember().getId(),
                    exception.getMessage()
            );
        }
    }
}