package com.skinclinic.domain.reservation.controller;

import com.skinclinic.domain.reservation.dto.ReservationAvailabilityResponse;
import com.skinclinic.domain.reservation.dto.ReservationCreateRequest;
import com.skinclinic.domain.reservation.dto.ReservationDetailResponse;
import com.skinclinic.domain.reservation.dto.ReservationResponse;
import com.skinclinic.domain.reservation.service.ReservationService;
import com.skinclinic.global.auth.CustomUserDetails;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @PostMapping
    public ReservationResponse create(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody ReservationCreateRequest request
    ) {
        return ReservationResponse.from(
                reservationService.create(userDetails.getMember().getId(), request)
        );
    }

    @GetMapping("/me")
    public List<ReservationResponse> myReservations(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return reservationService.getMyReservations(userDetails.getMember().getId())
                .stream()
                .map(ReservationResponse::from)
                .toList();
    }

    @GetMapping("/me/{id}")
    public ReservationDetailResponse myReservationDetail(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id
    ) {
        return ReservationDetailResponse.from(
                reservationService.getMyReservationDetail(userDetails.getMember().getId(), id)
        );
    }

    @PostMapping("/me/{id}/cancel")
    public ResponseEntity<Void> cancel(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id
    ) {
        reservationService.cancelMyReservation(userDetails.getMember().getId(), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/availability")
    public ReservationAvailabilityResponse availability(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return reservationService.getAvailability(date);
    }
}

