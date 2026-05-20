package com.skinclinic.domain.treatmentrecord.controller;

import com.skinclinic.domain.treatmentrecord.dto.TreatmentRecordCreateRequestDto;
import com.skinclinic.domain.treatmentrecord.dto.TreatmentRecordDetailResponseDto;
import com.skinclinic.domain.treatmentrecord.dto.TreatmentRecordListResponseDto;
import com.skinclinic.domain.treatmentrecord.dto.TreatmentRecordMemberPageResponseDto;
import com.skinclinic.domain.treatmentrecord.service.TreatmentRecordService;
import com.skinclinic.global.auth.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class TreatmentRecordApiController {

        private final TreatmentRecordService treatmentRecordService;

        // 관리자 또는 테스트용으로 시술 기록을 생성합니다.
        @PostMapping("/api/admin/treatment-records")
        public ResponseEntity<?> createTreatmentRecord(
                        @RequestParam Long memberId,
                        @RequestParam Long procedureId,
                        @RequestParam(required = false) Long paymentId,
                        @RequestParam LocalDate treatmentDate,
                        @RequestParam(required = false) String notes,
                        @RequestParam(required = false) MultipartFile beforeImage,
                        @RequestParam(required = false) MultipartFile afterImage) {
                TreatmentRecordCreateRequestDto dto = new TreatmentRecordCreateRequestDto();
                dto.setMemberId(memberId);
                dto.setProcedureId(procedureId);
                dto.setPaymentId(paymentId);
                dto.setTreatmentDate(treatmentDate);
                dto.setNotes(notes);
                dto.setBeforeImage(beforeImage);
                dto.setAfterImage(afterImage);

                Long treatmentRecordId = treatmentRecordService.createTreatmentRecord(dto);

                return ResponseEntity.ok(Map.of(
                                "id", treatmentRecordId,
                                "message", "시술 기록이 저장되었습니다."));
        }

        // 로그인한 사용자의 전체 시술 기록 목록을 조회합니다.
        @GetMapping("/api/treatment-records/me")
        public ResponseEntity<List<TreatmentRecordListResponseDto>> getMyTreatmentRecords(
                        @AuthenticationPrincipal CustomUserDetails userDetails) {
                return ResponseEntity.ok(
                                treatmentRecordService.getMyTreatmentRecords(userDetails.getUsername()));
        }

        // 로그인한 사용자의 특정 시술 기록 상세 정보를 조회합니다.
        @GetMapping("/api/treatment-records/{treatmentRecordId}")
        public ResponseEntity<TreatmentRecordDetailResponseDto> getMyTreatmentRecordDetail(
                        @AuthenticationPrincipal CustomUserDetails userDetails,
                        @PathVariable Long treatmentRecordId) {
                return ResponseEntity.ok(
                                treatmentRecordService.getMyTreatmentRecordDetail(userDetails.getUsername(),
                                                treatmentRecordId));
        }

        @GetMapping("/api/admin/members/{memberId}/treatment-records")
        public ResponseEntity<List<TreatmentRecordListResponseDto>> getMemberTreatmentRecords(
                        @PathVariable Long memberId) {
                return ResponseEntity.ok(
                                treatmentRecordService.getMemberTreatmentRecords(memberId));
        }

        @GetMapping("/api/admin/treatment-records/members")
        public ResponseEntity<TreatmentRecordMemberPageResponseDto> getTreatmentRecordMembers(
                        @RequestParam(required = false) String keyword,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "10") int size,
                        @RequestParam(defaultValue = "desc") String sort
        ) {
                return ResponseEntity.ok(
                                treatmentRecordService.getTreatmentRecordMembers(keyword, page, size, sort));
        }

        @GetMapping("/api/admin/members/{memberId}/treatment-records/{treatmentRecordId}")
        public ResponseEntity<TreatmentRecordDetailResponseDto> getMemberTreatmentRecordDetail(
                        @PathVariable Long memberId,
                        @PathVariable Long treatmentRecordId) {
                return ResponseEntity.ok(
                                treatmentRecordService.getMemberTreatmentRecordDetail(memberId, treatmentRecordId));
        }

        @DeleteMapping("/api/admin/members/{memberId}/treatment-records/{treatmentRecordId}")
        public ResponseEntity<?> deleteMemberTreatmentRecord(
                        @PathVariable Long memberId,
                        @PathVariable Long treatmentRecordId) {
                treatmentRecordService.deleteMemberTreatmentRecord(memberId, treatmentRecordId);
                return ResponseEntity.ok(Map.of("message", "시술 기록이 삭제되었습니다."));
        }

}
