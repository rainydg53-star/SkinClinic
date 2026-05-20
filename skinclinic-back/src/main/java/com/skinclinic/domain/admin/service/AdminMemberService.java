package com.skinclinic.domain.admin.service;

import com.skinclinic.domain.admin.dto.AdminMemberDetailDto;
import com.skinclinic.domain.admin.dto.AdminMemberListDto;
import com.skinclinic.domain.admin.dto.AdminMemberRoleUpdateRequestDto;
import com.skinclinic.domain.member.entity.Member;
import com.skinclinic.domain.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminMemberService {

    private final MemberRepository memberRepository;

    public List<AdminMemberListDto> getMembers(String keyword) {
        List<Member> members;

        if (keyword == null || keyword.trim().isEmpty()) {
            members = memberRepository.findAll();
        } else {
            members = memberRepository.findByNameContainingIgnoreCaseOrLoginIdContainingIgnoreCase(keyword, keyword);
        }

        return members.stream()
                .sorted(Comparator.comparing(Member::getId).reversed())
                .map(AdminMemberListDto::from)
                .toList();
    }

    public AdminMemberDetailDto getMember(Long memberId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));

        return AdminMemberDetailDto.from(member);
    }

    @Transactional
    public void updateRole(Long memberId, AdminMemberRoleUpdateRequestDto requestDto) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));

        member.changeRole(requestDto.getRole());
    }
}
