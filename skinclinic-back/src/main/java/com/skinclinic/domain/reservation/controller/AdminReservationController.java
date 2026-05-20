package com.skinclinic.domain.reservation.controller;

import com.skinclinic.domain.reservation.dto.ReservationDetailResponse;
import com.skinclinic.domain.reservation.dto.ReservationClosedDayRequest;
import com.skinclinic.domain.reservation.dto.ReservationClosedDayResponse;
import com.skinclinic.domain.reservation.dto.ReservationResponse;
import com.skinclinic.domain.reservation.dto.ReservationStatsResponse;
import com.skinclinic.domain.reservation.entity.ReservationStatus;
import com.skinclinic.domain.reservation.service.ReservationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.DeleteMapping;

@RestController
@RequestMapping("/api/admin/reservations")
public class AdminReservationController {

    private final ReservationService reservationService;

    public AdminReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @GetMapping("/stats")
    public ReservationStatsResponse stats(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        LocalDate target = date != null ? date : LocalDate.now();
        return reservationService.getStats(target);
    }

    @GetMapping("/all")
    public List<ReservationResponse> all() {
        return reservationService.getAllReservations().stream()
                .map(ReservationResponse::from)
                .toList();
    }

    @GetMapping
    public List<ReservationResponse> reservationsByDate(
            @RequestParam @NotNull @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return reservationService.getReservationsByDate(date).stream()
                .map(ReservationResponse::from)
                .toList();
    }

    @GetMapping("/{id}")
    public ReservationDetailResponse detail(@PathVariable Long id) {
        return ReservationDetailResponse.from(reservationService.getReservationDetail(id));
    }

    @PostMapping("/{id}/status")
    public void updateStatus(@PathVariable Long id, @RequestBody UpdateReservationStatusRequest request) {
        reservationService.updateStatus(id, request.status());
    }

    @GetMapping("/closed-days")
    public List<ReservationClosedDayResponse> getClosedDays(
            @RequestParam @NotNull @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @NotNull @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return reservationService.getClosedDays(from, to);
    }

    @PostMapping("/closed-days")
    public void addClosedDay(@Valid @RequestBody ReservationClosedDayRequest request) {
        reservationService.addClosedDay(request.date());
    }

    @DeleteMapping("/closed-days/{date}")
    public void removeClosedDay(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        reservationService.removeClosedDay(date);
    }

    public record UpdateReservationStatusRequest(ReservationStatus status) {
    }
}
