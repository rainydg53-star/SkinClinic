package com.skinclinic.domain.chat.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "consultation_session")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ConsultationSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String userLoginId;

    @Column(nullable = false, length = 100)
    private String userName;

    @Column(nullable = false, length = 100)
    private String adminLoginId;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ConsultationSessionStatus status;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime closedAt;

    @Column(length = 100)
    private String closedByLoginId;

    private LocalDateTime adminLastReadAt;

    @Builder
    public ConsultationSession(
            String userLoginId,
            String userName,
            String adminLoginId,
            ConsultationSessionStatus status,
            LocalDateTime createdAt
    ) {
        this.userLoginId = userLoginId;
        this.userName = userName;
        this.adminLoginId = adminLoginId;
        this.status = status;
        this.createdAt = createdAt;
    }

    public void close(String closedByLoginId) {
        if (this.status == ConsultationSessionStatus.CLOSED) {
            return;
        }
        this.status = ConsultationSessionStatus.CLOSED;
        this.closedByLoginId = closedByLoginId;
        this.closedAt = LocalDateTime.now();
    }

    public void markAdminRead(LocalDateTime readAt) {
        if (readAt == null) {
            return;
        }
        if (this.adminLastReadAt == null || this.adminLastReadAt.isBefore(readAt)) {
            this.adminLastReadAt = readAt;
        }
    }
}
