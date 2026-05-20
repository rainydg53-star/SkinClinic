package com.skinclinic.domain.admin.controller;


import com.skinclinic.domain.admin.dto.AdminMemberDetailDto;
import com.skinclinic.domain.admin.dto.AdminMemberListDto;
import com.skinclinic.domain.admin.dto.AdminMemberRoleUpdateRequestDto;
import com.skinclinic.domain.admin.service.AdminMemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/members")
public class AdminMemberController {

    private final AdminMemberService adminMemberService;

    @GetMapping
    public List<AdminMemberListDto> getMembers(
            @RequestParam(required = false) String keyword
    ) {
        return adminMemberService.getMembers(keyword);
    }

    @GetMapping("/{memberId}")
    public AdminMemberDetailDto getMember(@PathVariable Long memberId) {
        return adminMemberService.getMember(memberId);
    }

    @PutMapping("/{memberId}/role")
    public String updateRole(
            @PathVariable Long memberId,
            @Valid @RequestBody AdminMemberRoleUpdateRequestDto requestDto
    ) {
        adminMemberService.updateRole(memberId, requestDto);
        return "회원 권한이 변경되었습니다.";
    }
}
