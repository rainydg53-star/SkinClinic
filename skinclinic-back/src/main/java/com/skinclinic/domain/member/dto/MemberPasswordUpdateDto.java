package com.skinclinic.domain.member.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;


@Getter
@Setter
public class MemberPasswordUpdateDto {
    @NotBlank(message = "현재 비밀번호를 입력하세요.")
    private String currentPassword;
    @NotBlank(message = "새 비밀번호를 입력하세요.")
    private String newPassword;
    @NotBlank(message = "새 비밀번호 확인을 입력하세요.")
    private String confirmPassword;
}
