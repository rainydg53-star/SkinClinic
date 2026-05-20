package com.skinclinic.domain.skin.survey.controller;

import com.skinclinic.domain.member.service.MemberService;
import com.skinclinic.domain.skin.survey.dto.SkinSurveyRequest;
import com.skinclinic.domain.skin.survey.dto.SkinSurveyResponse;
import com.skinclinic.domain.skin.survey.service.SkinSurveyService;
import com.skinclinic.global.auth.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/skin-surveys")  //      /api/skin-surveys 공통주소
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5174")
// CrossOrigin 보안 정책인 CORS 문제를 해결, 프론트 서버가 기본 5173 포트
public class SkinSurveyController {
    private final SkinSurveyService skinSurveyService;
    private final MemberService memberService;

    @PostMapping  // 공통주소에 대한 POST 요청
    public ResponseEntity<SkinSurveyResponse> createSkinSurvey(
            @RequestBody SkinSurveyRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ){
        if (userDetails == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }

        Long userId = memberService.getMyInfo(userDetails.getUsername()).getId();
        SkinSurveyResponse response = skinSurveyService.createSkinSurvey(userId, request);
        // 1. 서비스 호출: DTO를 넘겨 비즈니스 로직 수행

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
        // 2. HTTP 상태코드 201(Created)과 함께 결과 DTO 반환
    }

    @GetMapping("/{id}")
    public ResponseEntity<SkinSurveyResponse> getSkinSurvey(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        if (userDetails == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }

        Long userId = memberService.getMyInfo(userDetails.getUsername()).getId();
        SkinSurveyResponse response = skinSurveyService.getSkinSurvey(id, userId);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/users/{userId}/latest")
    public ResponseEntity<SkinSurveyResponse> getLatestSkinSurveyByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(skinSurveyService.getLatestSkinSurveyByUser(userId));
    }

    @GetMapping("/me/latest")
    public ResponseEntity<SkinSurveyResponse> getMyLatestSkinSurvey(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        if (userDetails == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }

        Long userId = memberService.getMyInfo(userDetails.getUsername()).getId();
        return ResponseEntity.ok(skinSurveyService.getLatestSkinSurveyByUser(userId));
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<Page<SkinSurveyResponse>> getSkinSurveysByUser(
            @PathVariable Long userId,
            @PageableDefault(size = 1) Pageable pageable
    ) {
        return ResponseEntity.ok(skinSurveyService.getSkinSurveysByUser(userId, pageable));
    }
}
