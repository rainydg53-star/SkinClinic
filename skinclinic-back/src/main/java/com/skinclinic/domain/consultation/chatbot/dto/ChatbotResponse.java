package com.skinclinic.domain.consultation.chatbot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class ChatbotResponse {

    private String optionCode;  // 어떤 옵션코드인지
    private String optionLabel;  // 코드가 화면에 나타나는 이름
    private String answerTitle;  // 응답 제목
    private String answerBody;   // 실제 답변 본문
    private boolean aiEnhanced;  // Gemini로 답변이 보광되었는지 여부(true면 보강, false면 기본 답변)
    private boolean handoffRecommended;  // 관리자 1:1 상담 연결을 추천 상황 여부
    private List<ChatbotOptionDto> suggestedOptions;  // 현재 답변 다음에 보여줄 버튼 목록

}
