package com.skinclinic.domain.chat.controller;

import com.skinclinic.domain.chat.dto.ChatConversationSummaryDto;
import com.skinclinic.domain.chat.dto.ChatMessageResponseDto;
import com.skinclinic.domain.chat.dto.ChatSendRequestDto;
import com.skinclinic.domain.chat.dto.ConsultationSessionClosedEventDto;
import com.skinclinic.domain.chat.dto.ConsultationSessionPageResponseDto;
import com.skinclinic.domain.chat.dto.ConsultationSessionResponseDto;
import com.skinclinic.domain.chat.service.ConsultationChatService;
import com.skinclinic.global.auth.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ConsultationChatApiController {

    private final ConsultationChatService consultationChatService;
    private final SimpMessagingTemplate simpMessagingTemplate;

    @GetMapping("/api/chat/messages")
    public ResponseEntity<List<ChatMessageResponseDto>> getMyConversation(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(
                consultationChatService.getMessagesForUser(userDetails.getUsername())
        );
    }

    @GetMapping("/api/chat/sessions")
    public ResponseEntity<List<ConsultationSessionResponseDto>> getMySessions(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(
                consultationChatService.getSessionsForUser(userDetails.getUsername())
        );
    }

    @GetMapping("/api/chat/sessions/history")
    public ResponseEntity<ConsultationSessionPageResponseDto> getMyClosedSessions(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(
                consultationChatService.getClosedSessionsForUser(userDetails.getUsername(), page, size)
        );
    }

    @GetMapping("/api/chat/sessions/current")
    public ResponseEntity<ConsultationSessionResponseDto> getMyCurrentSession(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(
                consultationChatService.getCurrentSessionForUser(userDetails.getUsername())
        );
    }

    @PostMapping("/api/chat/sessions/current/start")
    public ResponseEntity<ConsultationSessionResponseDto> startMyCurrentSession(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(
                consultationChatService.startCurrentSessionByUser(userDetails.getUsername())
        );
    }

    @GetMapping("/api/chat/sessions/{sessionId}/messages")
    public ResponseEntity<List<ChatMessageResponseDto>> getMySessionMessages(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long sessionId
    ) {
        return ResponseEntity.ok(
                consultationChatService.getMessagesForUserSession(userDetails.getUsername(), sessionId)
        );
    }

    @PostMapping("/api/chat/sessions/current/close")
    public ResponseEntity<ConsultationSessionResponseDto> closeMyCurrentSession(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        ConsultationSessionResponseDto closed =
                consultationChatService.closeCurrentSessionByUser(userDetails.getUsername());
        publishSessionClosedEvent(closed);
        return ResponseEntity.ok(closed);
    }

    @PostMapping("/api/chat/messages")
    public ResponseEntity<ChatMessageResponseDto> sendMessage(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody ChatSendRequestDto requestDto
    ) {
        return ResponseEntity.ok(
                consultationChatService.sendMessage(
                        userDetails.getUsername(),
                        requestDto.getToLoginId(),
                        requestDto.getContent()
                )
        );
    }

    @GetMapping("/api/admin/chat/messages")
    public ResponseEntity<List<ChatMessageResponseDto>> getAdminConversation(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam String conversationUserLoginId
    ) {
        return ResponseEntity.ok(
                consultationChatService.getMessagesForAdmin(
                        userDetails.getUsername(),
                        conversationUserLoginId
                )
        );
    }

    @GetMapping("/api/admin/chat/sessions/{sessionId}/messages")
    public ResponseEntity<List<ChatMessageResponseDto>> getAdminSessionMessages(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long sessionId
    ) {
        return ResponseEntity.ok(
                consultationChatService.getMessagesForAdminSession(userDetails.getUsername(), sessionId)
        );
    }

    @PostMapping("/api/admin/chat/sessions/{sessionId}/close")
    public ResponseEntity<ConsultationSessionResponseDto> closeSessionByAdmin(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long sessionId
    ) {
        ConsultationSessionResponseDto closed =
                consultationChatService.closeSessionByAdmin(userDetails.getUsername(), sessionId);
        publishSessionClosedEvent(closed);
        return ResponseEntity.ok(closed);
    }

    @GetMapping("/api/admin/chat/users/{userLoginId}/sessions")
    public ResponseEntity<List<ConsultationSessionResponseDto>> getAdminUserSessions(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String userLoginId
    ) {
        return ResponseEntity.ok(
                consultationChatService.getSessionsForAdminUser(userDetails.getUsername(), userLoginId)
        );
    }

    @GetMapping("/api/admin/chat/users/{userLoginId}/sessions/history")
    public ResponseEntity<ConsultationSessionPageResponseDto> getAdminUserClosedSessions(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String userLoginId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(
                consultationChatService.getClosedSessionsForAdminUser(
                        userDetails.getUsername(),
                        userLoginId,
                        page,
                        size
                )
        );
    }

    @GetMapping("/api/admin/chat/conversations")
    public ResponseEntity<List<ChatConversationSummaryDto>> getAdminConversations(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(
                consultationChatService.getConversationSummariesForAdmin(userDetails.getUsername())
        );
    }

    private void publishSessionClosedEvent(ConsultationSessionResponseDto closed) {
        simpMessagingTemplate.convertAndSend(
                "/topic/consultation/" + closed.getUserLoginId(),
                ConsultationSessionClosedEventDto.builder()
                        .eventType("SESSION_CLOSED")
                        .sessionId(closed.getId())
                        .conversationUserLoginId(closed.getUserLoginId())
                        .closedByLoginId(closed.getClosedByLoginId())
                        .build()
        );
    }
}
