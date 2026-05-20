package com.skinclinic.domain.member.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class MemberUpdateDto {

    @NotBlank(message = "이름은 필수입니다.")
    private String name;


    @NotBlank(message = "전화번호는 필수입니다.")
    private String phone;
}