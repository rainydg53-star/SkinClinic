package com.skinclinic.domain.member.repository;

import com.skinclinic.domain.member.entity.Member;
import com.skinclinic.domain.member.entity.Role;
import com.skinclinic.domain.member.entity.SocialProvider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.time.LocalDateTime;
import java.util.Optional;

public interface MemberRepository extends JpaRepository<Member, Long> {
    Optional<Member> findByLoginId(String loginId);
    Optional<Member> findByEmail(String email);
    boolean existsByLoginId(String loginId);
    boolean existsByEmail(String email);
    Optional<Member> findByNameAndEmail(String name, String email);
    Optional<Member> findByLoginIdAndEmail(String loginId, String email);
    Optional<Member> findBySocialProviderAndSocialId(SocialProvider socialProvider, String socialId);
    List<Member> findByNameContainingIgnoreCaseOrLoginIdContainingIgnoreCase(String name, String loginId);
    Optional<Member> findFirstByRole(Role role);
    List<Member> findByLoginIdIn(List<String> loginIds);
    long countByDeletedFalse();
    long countByDeletedFalseAndCreatedAtBetween(LocalDateTime from, LocalDateTime to);
}
