package com.skinclinic.domain.admin.dto;

import com.skinclinic.domain.member.entity.Role;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminMemberRoleUpdateRequestDto {

    @NotNull(message = "권한은 필수입니다.")
    private Role role;
}