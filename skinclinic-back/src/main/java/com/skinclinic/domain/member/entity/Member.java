package com.skinclinic.domain.member.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "member")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column(nullable = false, unique = true)
    private String loginId;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, length = 20)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private SocialProvider socialProvider;

    @Column(length = 100, unique = true)
    private String socialId;

    @Column(nullable = false)
    private boolean deleted = false;

    private LocalDateTime createdAt;

    private LocalDateTime deletedAt;

    @Builder
    public Member(String loginId, String name, String email, String password, String phone, Role role,
                  SocialProvider socialProvider, String socialId) {
        this.loginId = loginId;
        this.name = name;
        this.email = email;
        this.password = password;
        this.phone = phone;
        this.role = role;
        this.socialProvider = socialProvider;
        this.socialId = socialId;
    }

    public void updateProfile(String name, String phone) {
        this.name = name;
        this.phone = phone;
    }

    public void changePassword(String newPassword) {
        this.password = newPassword;
    }

    public void changeRole(Role role) {
        this.role = role;
    }

    public void linkSocialAccount(SocialProvider socialProvider, String socialId) {
        this.socialProvider = socialProvider;
        this.socialId = socialId;
    }

    public void withdraw() {
        long deletedKey = System.currentTimeMillis();

        this.deleted = true;
        this.deletedAt = LocalDateTime.now();
        this.loginId = "deleted_" + this.id + "_" + deletedKey;
        this.email = "deleted+" + this.id + "_" + deletedKey + "@withdrawn.local";
        this.socialProvider = null;
        this.socialId = null;
        this.phone = "";
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}
