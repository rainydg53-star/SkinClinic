package com.skinclinic.domain.chat.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ConsultationSessionClosedEventDto {
    private String eventType;
    private Long sessionId;
    private String conversationUserLoginId;
    private String closedByLoginId;
}

