package com.skinclinic.domain.consultation.chatbot.controller;

import com.skinclinic.domain.consultation.chatbot.dto.ChatbotMessageRequest;
import com.skinclinic.domain.consultation.chatbot.dto.ChatbotResponse;
import com.skinclinic.domain.consultation.chatbot.service.ChatbotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotService chatbotService;

    @GetMapping("/welcome")
    public ResponseEntity<ChatbotResponse> getWelcome() {
         return ResponseEntity.ok(chatbotService.getWelcome());
    }

    @PostMapping("/messages")
    public ResponseEntity<ChatbotResponse> sendMessage(@RequestBody ChatbotMessageRequest request) {
        if (request == null || (!request.hasOptionCode() && !request.hasMessage())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "optionCode 또는 message 중 하나는 필요합니다.");
        }

        return ResponseEntity.ok(chatbotService.reply(request));
    }
}
