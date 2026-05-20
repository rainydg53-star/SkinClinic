package com.skinclinic.domain.member.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
/*패스워드 변경 요청 DTO*/
public class PasswordResetRequestDto {
    private String loginId;
    private String newPassword;
}
