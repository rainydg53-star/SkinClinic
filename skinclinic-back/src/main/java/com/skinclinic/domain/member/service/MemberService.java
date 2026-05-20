package com.skinclinic.domain.member.service;

import com.skinclinic.domain.member.dto.*;
import com.skinclinic.domain.member.entity.EmailVerification;
import com.skinclinic.domain.member.entity.Member;
import com.skinclinic.domain.member.entity.Role;
import com.skinclinic.domain.member.entity.SocialProvider;
import com.skinclinic.domain.member.repository.EmailVerificationRepository;
import com.skinclinic.domain.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class MemberService {
    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final EmailVerificationRepository emailVerificationRepository;

    public Long signUp(MemberSignUpDto dto) {
        String loginId = dto.isSocialSignup()
                ? createSocialLoginId(dto)
                : dto.getLoginId();

        validateLoginId(loginId, dto.isSocialSignup());
        validateDuplicateLoginId(loginId);
        validateDuplicateEmail(dto.getEmail());

        if (!dto.isSocialSignup()) {
            validateEmailVerified(dto.getEmail());
            validatePassword(dto.getPassword());
        }

        Role role = "1".equals(loginId) ? Role.ADMIN : Role.USER;

        Member member = Member.builder()
                .loginId(loginId)
                .name(dto.getName())
                .email(dto.getEmail())
                .password(dto.isSocialSignup()
                        ? passwordEncoder.encode(UUID.randomUUID().toString())
                        : passwordEncoder.encode(dto.getPassword()))
                .phone(dto.getPhone())
                .role(role)
                .socialProvider(resolveSocialProvider(dto))
                .socialId(dto.isSocialSignup() ? dto.getSocialId() : null)
                .build();

        memberRepository.save(member);
        return member.getId();
    }

    private String createSocialLoginId(MemberSignUpDto dto) {
        String provider = dto.getSocialProvider() == null || dto.getSocialProvider().isBlank()
                ? "social"
                : dto.getSocialProvider().toLowerCase();
        String socialId = dto.getSocialId() == null || dto.getSocialId().isBlank()
                ? UUID.randomUUID().toString().replace("-", "")
                : dto.getSocialId();

        return provider + "_" + socialId;
    }

    private void validateLoginId(String loginId, boolean socialSignup) {
        if (socialSignup) {
            return;
        }

        if (loginId == null || loginId.isBlank()) {
            throw new IllegalArgumentException("아이디는 필수 입력입니다.");
        }
    }

    private void validateDuplicateLoginId(String loginId) {
        if (memberRepository.existsByLoginId(loginId)) {
            throw new IllegalArgumentException("이미 가입한 아이디입니다.");
        }
    }

    private void validateDuplicateEmail(String email) {
        if (memberRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("이미 가입한 이메일입니다.");
        }
    }

    private void validateEmailVerified(String email) {
        EmailVerification verification = emailVerificationRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("이메일 인증을 진행해주세요."));

        if (!verification.isVerified()) {
            throw new IllegalArgumentException("이메일 인증을 완료해주세요.");
        }
    }

    private void validatePassword(String password) {
        if (password == null || password.isBlank()) {
            throw new IllegalArgumentException("비밀번호는 필수 입력입니다.");
        }

        if (password.length() < 1 || password.length() > 16) {
            throw new IllegalArgumentException("비밀번호는 1자 이상, 16자 이하로 입력해주세요.");
        }
    }

    private SocialProvider resolveSocialProvider(MemberSignUpDto dto) {
        if (!dto.isSocialSignup() || dto.getSocialProvider() == null || dto.getSocialProvider().isBlank()) {
            return null;
        }

        return SocialProvider.valueOf(dto.getSocialProvider().toUpperCase());
    }

    public FindLoginIdResponseDto findLoginId(FindLoginIdRequestDto requestDto) {
        Member member = memberRepository.findByNameAndEmail(requestDto.getName(), requestDto.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("일치하는 회원정보가 없습니다"));

        return new FindLoginIdResponseDto(member.getLoginId(), "아이디찾기가 완료되었습니다.");
    }

    @Transactional(readOnly = true)
    public MemberInfoDto getMyInfo(String loginId) {
        Member member = memberRepository.findByLoginId(loginId)
                .orElseThrow(() -> new IllegalArgumentException("회원 정보를 찾을 수 없습니다."));
        return MemberInfoDto.from(member);
    }

    @Transactional(readOnly = true)
    public MemberUpdateDto getMyInfoForUpdate(String loginId) {
        Member member = memberRepository.findByLoginId(loginId)
                .orElseThrow(() -> new IllegalArgumentException("회원 정보를 찾을 수 없습니다."));

        MemberUpdateDto dto = new MemberUpdateDto();
        dto.setName(member.getName());
        dto.setPhone(member.getPhone());
        return dto;
    }

    public void updateMyInfo(String loginId, MemberUpdateDto dto) {
        Member member = memberRepository.findByLoginId(loginId)
                .orElseThrow(() -> new IllegalArgumentException("회원 정보를 찾을 수 없습니다."));

        String updatedName = member.getSocialProvider() != null ? member.getName() : dto.getName();
        member.updateProfile(updatedName, dto.getPhone());
    }

    public void changePassword(String loginId, MemberPasswordUpdateDto dto) {
        Member member = memberRepository.findByLoginId(loginId)
                .orElseThrow(() -> new IllegalArgumentException("회원이 존재하지 않습니다."));

        if (!passwordEncoder.matches(dto.getCurrentPassword(), member.getPassword())) {
            throw new IllegalArgumentException("현재 비밀번호가 올바르지 않습니다.");
        }

        member.changePassword(passwordEncoder.encode(dto.getNewPassword()));
    }

    public void sendEmailCode(String email) {
        email = normalizeEmail(email);

        if (memberRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("이미 가입한 이메일입니다.");
        }

        sendVerificationCode(email);
    }

    public boolean verifyEmail(String email, String code) {
        email = normalizeEmail(email);
        code = code == null ? null : code.trim();

        EmailVerification verification = emailVerificationRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("인증 요청이 없습니다."));

        if (verification.isVerified()) {
            throw new IllegalArgumentException("이미 인증이 완료되었습니다.");
        }

        if (verification.isExpired()) {
            throw new IllegalArgumentException("인증번호가 만료되었습니다. 다시 요청해 주세요.");
        }

        if (verification.getCode().equals(code)) {
            verification.verify();
            emailVerificationRepository.save(verification);
            return true;
        }

        return false;
    }

    private void sendVerificationCode(String email) {
        String code = createCode();

        EmailVerification verification = emailVerificationRepository.findByEmail(email)
                .orElse(
                        EmailVerification.builder()
                                .email(email)
                                .verified(false)
                                .build()
                );

        verification.changeCode(code);
        verification.unverify();
        verification.changeExpiredAt(LocalDateTime.now().plusMinutes(5));
        emailVerificationRepository.save(verification);

        emailService.sendEmail(email, code);
    }

    public String createCode() {
        Random random = new Random();
        int number = random.nextInt(900000) + 100000;
        return String.valueOf(number);
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    public void sendPasswordResetCode(String loginId, String email) {
        email = normalizeEmail(email);

        Member member = memberRepository.findByLoginIdAndEmail(loginId, email)
                .orElseThrow(() -> new IllegalArgumentException("회원 정보를 찾을 수 없습니다."));

        sendVerificationCode(member.getEmail());
    }

    @Transactional
    public void resetPassword(PasswordResetRequestDto dto) {
        Member member = memberRepository.findByLoginId(dto.getLoginId())
                .orElseThrow(() -> new IllegalArgumentException("회원 정보를 찾을 수 없습니다"));

        if (passwordEncoder.matches(dto.getNewPassword(), member.getPassword())) {
            throw new IllegalArgumentException("기존 비밀번호와 동일한 비밀번호는 사용할 수 없습니다.");
        }

        member.changePassword(passwordEncoder.encode(dto.getNewPassword()));
    }

    public void verifyPassword(String loginId, String password) {
        Member member = memberRepository.findByLoginId(loginId)
                .orElseThrow(() -> new IllegalArgumentException("회원이 존재하지 않습니다."));

        if (!passwordEncoder.matches(password, member.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 올바르지 않습니다.");
        }
    }

    public void withdraw(String loginId, String password) {
        Member member = memberRepository.findByLoginId(loginId)
                .orElseThrow(() -> new IllegalArgumentException("회원 정보를 찾을 수 없습니다."));

        if (member.isDeleted()) {
            throw new IllegalArgumentException("이미 탈퇴한 회원입니다.");
        }

        if (member.getSocialProvider() == null) {
            if (password == null || password.isBlank()) {
                throw new IllegalArgumentException("비밀번호를 입력해주세요.");
            }

            if (!passwordEncoder.matches(password, member.getPassword())) {
                throw new IllegalArgumentException("비밀번호가 올바르지 않습니다.");
            }
        }

        member.withdraw();
    }
}
