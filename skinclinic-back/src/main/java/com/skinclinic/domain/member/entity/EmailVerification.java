package com.skinclinic.domain.member.entity;


import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.*;

import java.time.LocalDateTime;

@Setter
@Entity
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String email;
    private String code;
    private boolean verified;
    private LocalDateTime expiredAt;

    @Builder
    public EmailVerification(String email, String code, boolean verified, LocalDateTime expiredAt) {
        this.email = email;
        this.code = code;
        this.verified = verified;
        this.expiredAt = expiredAt;
    }

    public void verify() {
        this.verified = true;
    }

    public void changeCode(String code) {
        this.code = code;
        this.verified = false;
    }
    public void unverify() {
        this.verified = false;
    }
    public void changeExpiredAt(LocalDateTime expiredAt) {
        this.expiredAt = expiredAt;
    }

    public boolean isExpired() {
        return expiredAt == null || LocalDateTime.now().isAfter(expiredAt);
    }
}
