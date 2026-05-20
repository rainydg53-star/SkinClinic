package com.skinclinic.domain.chat.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "consultation_message")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ConsultationMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long sessionId;

    @Column(nullable = false, length = 100)
    private String conversationUserLoginId;

    @Column(nullable = false, length = 100)
    private String senderLoginId;

    @Column(nullable = false, length = 100)
    private String receiverLoginId;

    @Column(nullable = false, length = 2000)
    private String content;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Builder
    public ConsultationMessage(
            String conversationUserLoginId,
            Long sessionId,
            String senderLoginId,
            String receiverLoginId,
            String content,
            LocalDateTime createdAt
    ) {
        this.conversationUserLoginId = conversationUserLoginId;
        this.sessionId = sessionId;
        this.senderLoginId = senderLoginId;
        this.receiverLoginId = receiverLoginId;
        this.content = content;
        this.createdAt = createdAt;
    }
}
