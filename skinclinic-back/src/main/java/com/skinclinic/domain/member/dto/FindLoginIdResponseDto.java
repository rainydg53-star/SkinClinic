package com.skinclinic.domain.member.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
/* 아이디찾기 응답하는 DTO*/
public class FindLoginIdResponseDto {
    private String loginId;
    private String message;

}
