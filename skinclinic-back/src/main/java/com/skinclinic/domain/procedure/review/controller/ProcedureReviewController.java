package com.skinclinic.domain.procedure.review.controller;

import com.skinclinic.domain.procedure.review.dto.AdminProcedureReviewItemResponse;
import com.skinclinic.domain.procedure.review.dto.ProcedureReviewCandidateResponse;
import com.skinclinic.domain.procedure.review.dto.ProcedureReviewCreateRequest;
import com.skinclinic.domain.procedure.review.dto.ProcedureReviewResponse;
import com.skinclinic.domain.procedure.review.dto.ProcedureSatisfactionStatsResponse;
import com.skinclinic.domain.procedure.review.service.ProcedureReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class ProcedureReviewController {

    private final ProcedureReviewService procedureReviewService;

    @GetMapping("/procedure-reviews/users/{userId}/candidates")
    public List<ProcedureReviewCandidateResponse> getReviewCandidates(@PathVariable Long userId) {
        return procedureReviewService.getReviewCandidates(userId);
    }

    @GetMapping("/procedure-reviews/users/{userId}")
    public List<ProcedureReviewResponse> getUserReviews(@PathVariable Long userId) {
        return procedureReviewService.getUserReviews(userId);
    }

    @PostMapping("/procedure-reviews")
    public ProcedureReviewResponse createReview(@RequestBody @Valid ProcedureReviewCreateRequest request) {
        return procedureReviewService.createReview(request);
    }

    @GetMapping("/admin/procedure-review-stats")
    public ProcedureSatisfactionStatsResponse getStatistics() {
        return procedureReviewService.getStatistics();
    }

    @GetMapping("/admin/procedure-reviews")
    public List<AdminProcedureReviewItemResponse> getAdminReviews() {
        return procedureReviewService.getAdminReviews();
    }
}
