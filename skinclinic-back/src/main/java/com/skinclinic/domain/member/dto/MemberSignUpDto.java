package com.skinclinic.domain.member.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MemberSignUpDto {

    private String loginId;

    @NotBlank(message = "이름은 필수 입력입니다.")
    private String name;

    @NotBlank(message = "이메일은 필수 입력입니다.")
    @Email(message = "올바른 이메일 형식으로 입력해주세요.")
    private String email;

    private String password;

    @NotBlank(message = "전화번호는 필수 입력입니다.")
    private String phone;

    private boolean emailVerified;

    private boolean socialSignup;

    private String socialProvider;

    private String socialId;
}
