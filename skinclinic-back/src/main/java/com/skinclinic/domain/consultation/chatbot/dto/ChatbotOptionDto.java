package com.skinclinic.domain.consultation.chatbot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor // 모든 필드 배개변수로 받는 생성자
public class ChatbotOptionDto {

    private String code;   // 버튼 클릭 코드
    private String label;  // 화면에 보이는 버튼 이름
    private String description;  // 버튼 아래 붙는 설명

}
