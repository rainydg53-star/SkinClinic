package com.skinclinic.global.config;

import com.skinclinic.domain.member.entity.Member;
import com.skinclinic.domain.member.entity.Role;
import com.skinclinic.domain.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AdminInitializer implements CommandLineRunner {

   private final MemberRepository memberRepository;
   private final PasswordEncoder passwordEncoder;

   @Override
   public void run(String... args) {

       boolean adminExists = memberRepository.existsByLoginId("1")
               || memberRepository.existsByEmail("admin@skinclinic.com");

       if (!adminExists) {

           Member admin = Member.builder()
                   .loginId("1")
                   .name("관리자")
                   .email("admin@skinclinic.com")
                   .password(passwordEncoder.encode("1"))
                   .phone("01000000000")
                   .role(Role.ADMIN)
                   .build();

           memberRepository.save(admin);

           System.out.println("관리자 계정 생성 완료: 1 / 1");
       }
   }
}
