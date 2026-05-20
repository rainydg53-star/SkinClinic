package com.skinclinic.domain.member.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
/* 아이디찾기 요청DTO*/
public class FindLoginIdRequestDto {
    @NotBlank(message = "이름은 필수 입력입니다.")
    private String name;

    @NotBlank(message = "이메일 필수 입력입니다.")
    @Email(message = "올바른 이메일 형식이 아닙니다.")
    private String email;
}
