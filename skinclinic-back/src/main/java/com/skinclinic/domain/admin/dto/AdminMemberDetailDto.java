package com.skinclinic.domain.admin.dto;

import com.skinclinic.domain.member.entity.Member;
import com.skinclinic.domain.member.entity.Role;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AdminMemberDetailDto {

    private Long id;
    private String loginId;
    private String name;
    private String email;
    private String phone;
    private Role role;

    public static AdminMemberDetailDto from(Member member) {
        return AdminMemberDetailDto.builder()
                .id(member.getId())
                .loginId(member.getLoginId())
                .name(member.getName())
                .email(member.getEmail())
                .phone(member.getPhone())
                .role(member.getRole())
                .build();
    }
}
