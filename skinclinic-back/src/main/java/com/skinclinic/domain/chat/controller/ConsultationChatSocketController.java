package com.skinclinic.domain.chat.controller;

import com.skinclinic.domain.chat.dto.ChatMessageResponseDto;
import com.skinclinic.domain.chat.dto.ChatSendRequestDto;
import com.skinclinic.domain.chat.service.ConsultationChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class ConsultationChatSocketController {

    private final ConsultationChatService consultationChatService;
    private final SimpMessagingTemplate simpMessagingTemplate;

    @MessageMapping("/consultation/send")
    public void send(@Payload ChatSendRequestDto requestDto, Principal principal) {
        if (principal == null) {
            throw new IllegalArgumentException("Unauthorized websocket message.");
        }

        ChatMessageResponseDto saved = consultationChatService.sendMessage(
                principal.getName(),
                requestDto.getToLoginId(),
                requestDto.getContent()
        );

        simpMessagingTemplate.convertAndSend(
                "/topic/consultation/" + saved.getConversationUserLoginId(),
                saved
        );
    }
}

