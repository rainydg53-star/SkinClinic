package com.skinclinic.domain.consultation.chatbot.dto;

import lombok.Getter;
import org.springframework.util.StringUtils;

@Getter
public class ChatbotMessageRequest {
    private String optionCode;  // 사용자가 누른 버튼의 코드 값.
    private String message;  // 사용자가 직접 입력한 상담 내용.

    public boolean hasOptionCode() {
        return StringUtils.hasText(optionCode);
    }

    public boolean hasMessage() {
        return StringUtils.hasText(message);
    }
}
