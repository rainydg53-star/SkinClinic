package com.skinclinic.domain.reservation.repository;

import com.skinclinic.domain.reservation.entity.ReservationClosedDay;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReservationClosedDayRepository extends JpaRepository<ReservationClosedDay, Long> {
    boolean existsByClosedDate(LocalDate closedDate);
    Optional<ReservationClosedDay> findByClosedDate(LocalDate closedDate);
    List<ReservationClosedDay> findByClosedDateBetweenOrderByClosedDateAsc(LocalDate from, LocalDate to);
}
