package com.skinclinic.domain.reservation.repository;

import com.skinclinic.domain.reservation.entity.Reservation;
import com.skinclinic.domain.reservation.entity.ReservationStatus;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    @EntityGraph(attributePaths = "procedure")
    List<Reservation> findByMember_IdOrderByReservationDateDescReservationTimeDesc(Long memberId);

    @EntityGraph(attributePaths = "procedure")
    Optional<Reservation> findByIdAndMember_Id(Long id, Long memberId);

    @EntityGraph(attributePaths = "procedure")
    Optional<Reservation> findTopByMember_IdAndProcedure_IdAndStatusOrderByCreatedAtDesc(
            Long memberId,
            Long procedureId,
            ReservationStatus status
    );

    @EntityGraph(attributePaths = "procedure")
    Optional<Reservation> findTopByMember_IdAndProcedure_IdAndStatusInOrderByCreatedAtDesc(
            Long memberId,
            Long procedureId,
            List<ReservationStatus> statuses
    );

    @EntityGraph(attributePaths = "procedure")
    List<Reservation> findByReservationDateOrderByReservationTimeAsc(LocalDate reservationDate);

    boolean existsByReservationDateAndReservationTimeAndStatusIn(
            LocalDate reservationDate,
            LocalTime reservationTime,
            List<ReservationStatus> statuses
    );

    long countByReservationDateAndReservationTimeAndStatusIn(
            LocalDate reservationDate,
            LocalTime reservationTime,
            List<ReservationStatus> statuses
    );

    List<Reservation> findByReservationDateAndStatusIn(LocalDate reservationDate, List<ReservationStatus> statuses);

    @EntityGraph(attributePaths = "procedure")
    List<Reservation> findAllByOrderByReservationDateDescReservationTimeDesc();

    long countByReservationDate(LocalDate reservationDate);

    long countByReservationDateAndStatusNot(LocalDate reservationDate, ReservationStatus status);
}
