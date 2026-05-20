package com.skinclinic.domain.chat.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ChatConversationSummaryDto {
    private String userLoginId;
    private String userName;
    private String lastMessage;
    private LocalDateTime lastMessageAt;
    private long unreadCount;
}
