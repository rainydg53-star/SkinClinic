package com.skinclinic.domain.member.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EmailVerifyDto {
    private String email;
    private String code;
}
