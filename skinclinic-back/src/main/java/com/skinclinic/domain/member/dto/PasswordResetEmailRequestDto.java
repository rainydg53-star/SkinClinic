package com.skinclinic.domain.member.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
/*패스워드 변경할때 이메일 요청 DTO*/
public class PasswordResetEmailRequestDto {
    private String loginId;
    private String email;
}
