package com.skinclinic.domain.member.controller;

import com.skinclinic.domain.member.dto.*;
import com.skinclinic.domain.member.service.MemberService;
import com.skinclinic.global.auth.CustomUserDetails;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/members")
public class MemberApiController {
    private final MemberService memberService;

    @PostMapping("/signup")
    public ResponseEntity<?> signUp(@Valid @RequestBody MemberSignUpDto dto) {
        memberService.signUp(dto);
        return ResponseEntity.ok(Map.of("message", "회원가입이 완료되었습니다."));
    }

    @PostMapping("/send-code")
    public ResponseEntity<?> sendCode(@RequestBody PasswordResetEmailRequestDto dto) {
        memberService.sendPasswordResetCode(dto.getLoginId(), dto.getEmail());
        return ResponseEntity.ok(Map.of("message", "인증번호가 이메일로 전송되었습니다."));
    }

    @PostMapping("/verify-code")
    public ResponseEntity<?> verifyCode(@RequestBody EmailVerifyDto dto) {
        boolean verified = memberService.verifyEmail(dto.getEmail(), dto.getCode());

        if (!verified) {
            throw new IllegalArgumentException("인증번호가 올바르지 않습니다.");
        }

        return ResponseEntity.ok(Map.of("message", "이메일 인증이 완료되었습니다."));
    }

    @PostMapping("/reset")
    public ResponseEntity<?> resetPassword(@RequestBody PasswordResetRequestDto dto) {
        memberService.resetPassword(dto);
        return ResponseEntity.ok(Map.of("message", "비밀번호가 변경되었습니다."));
    }

    @PostMapping("/find-id")
    public ResponseEntity<FindLoginIdResponseDto> findLoginId(@Valid @RequestBody FindLoginIdRequestDto requestDto) {
        FindLoginIdResponseDto response = memberService.findLoginId(requestDto);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<MemberInfoDto> getMyInfo(@AuthenticationPrincipal CustomUserDetails userDetails) {
        MemberInfoDto response = memberService.getMyInfo(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateMyInfo(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody MemberUpdateDto memberUpdateDto
    ) {
        memberService.updateMyInfo(userDetails.getUsername(), memberUpdateDto);
        return ResponseEntity.ok(Map.of("message", "회원 정보가 수정되었습니다."));
    }

    @PutMapping("/me/password")
    public ResponseEntity<?> changeMyPassword(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody MemberPasswordUpdateDto dto
    ) {
        memberService.changePassword(userDetails.getUsername(), dto);
        return ResponseEntity.ok(Map.of("message", "비밀번호가 변경되었습니다."));
    }

    @PostMapping("/verify-password")
    public ResponseEntity<?> verifyPassword(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Map<String, String> request
    ) {
        String password = request.get("password");
        memberService.verifyPassword(userDetails.getUsername(), password);

        return ResponseEntity.ok(Map.of("message", "비밀번호 확인 성공"));
    }

    @DeleteMapping("/me")
    public ResponseEntity<?> withdrawMyAccount(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody(required = false) MemberWithdrawRequestDto dto,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        String password = dto == null ? null : dto.getPassword();

        memberService.withdraw(userDetails.getUsername(), password);

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null) {
            new SecurityContextLogoutHandler().logout(request, response, authentication);
        }

        return ResponseEntity.ok(Map.of("message", "회원 탈퇴가 완료되었습니다."));
    }
}
