package com.skinclinic.domain.chat.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ChatMessageResponseDto {
    private Long id;
    private Long sessionId;
    private String conversationUserLoginId;
    private String senderLoginId;
    private String senderName;
    private String receiverLoginId;
    private String receiverName;
    private String content;
    private LocalDateTime createdAt;
}
