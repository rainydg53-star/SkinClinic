package com.skinclinic.domain.chat.service;

import com.skinclinic.domain.chat.dto.ChatConversationSummaryDto;
import com.skinclinic.domain.chat.dto.ChatMessageResponseDto;
import com.skinclinic.domain.chat.dto.ConsultationSessionPageResponseDto;
import com.skinclinic.domain.chat.dto.ConsultationSessionResponseDto;
import com.skinclinic.domain.chat.entity.ConsultationMessage;
import com.skinclinic.domain.chat.entity.ConsultationSession;
import com.skinclinic.domain.chat.entity.ConsultationSessionStatus;
import com.skinclinic.domain.chat.repository.ConsultationMessageRepository;
import com.skinclinic.domain.chat.repository.ConsultationSessionRepository;
import com.skinclinic.domain.member.entity.Member;
import com.skinclinic.domain.member.entity.Role;
import com.skinclinic.domain.member.repository.MemberRepository;
import com.skinclinic.domain.notification.dto.ConsultationNotificationCommand;
import com.skinclinic.domain.notification.service.ConsultationNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class ConsultationChatService {

    private final ConsultationMessageRepository consultationMessageRepository;
    private final ConsultationSessionRepository consultationSessionRepository;
    private final MemberRepository memberRepository;
    private final ConsultationNotificationService consultationNotificationService;

    public ChatMessageResponseDto sendMessage(String senderLoginId, String toLoginId, String content) {
        Member sender = getMember(senderLoginId);
        String trimmedContent = content == null ? "" : content.trim();

        if (trimmedContent.isBlank()) {
            throw new IllegalArgumentException("Message content is required.");
        }

        if (trimmedContent.length() > 2000) {
            throw new IllegalArgumentException("Message content is too long.");
        }

        String conversationUserLoginId;
        Member receiver;

        if (sender.getRole() == Role.ADMIN) {
            if (toLoginId == null || toLoginId.isBlank()) {
                throw new IllegalArgumentException("Admin must provide target user loginId.");
            }

            receiver = getMember(toLoginId.trim());
            if (receiver.getRole() == Role.ADMIN) {
                throw new IllegalArgumentException("Admin-to-admin conversation is not supported.");
            }
            conversationUserLoginId = receiver.getLoginId();
        } else {
            Member admin = getMainAdmin();
            receiver = admin;
            conversationUserLoginId = sender.getLoginId();
        }

        ConsultationSession session = getOrCreateOpenSession(conversationUserLoginId);

        ConsultationMessage saved = consultationMessageRepository.save(
                ConsultationMessage.builder()
                        .sessionId(session.getId())
                        .conversationUserLoginId(conversationUserLoginId)
                        .senderLoginId(sender.getLoginId())
                        .receiverLoginId(receiver.getLoginId())
                        .content(trimmedContent)
                        .createdAt(LocalDateTime.now())
                        .build()
        );

        if (sender.getRole() == Role.ADMIN) {
            session.markAdminRead(saved.getCreatedAt());
        }

        return toMessageResponse(saved, sender.getName(), receiver.getName());
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponseDto> getMessagesForUser(String userLoginId) {
        ConsultationSession openSession = consultationSessionRepository
                .findFirstByUserLoginIdAndStatusOrderByCreatedAtDesc(userLoginId, ConsultationSessionStatus.OPEN)
                .orElse(null);

        if (openSession == null) {
            return List.of();
        }

        return toMessageResponses(consultationMessageRepository.findBySessionIdOrderByCreatedAtAsc(openSession.getId()));
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponseDto> getMessagesForUserSession(String userLoginId, Long sessionId) {
        consultationSessionRepository.findByIdAndUserLoginId(sessionId, userLoginId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found."));

        return toMessageResponses(consultationMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId));
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponseDto> getMessagesForAdmin(String adminLoginId, String conversationUserLoginId) {
        ensureAdmin(adminLoginId);

        ConsultationSession openSession = consultationSessionRepository
                .findFirstByUserLoginIdAndStatusOrderByCreatedAtDesc(
                        conversationUserLoginId.trim(),
                        ConsultationSessionStatus.OPEN
                )
                .orElse(null);

        if (openSession == null) {
            return List.of();
        }

        List<ConsultationMessage> messages =
                consultationMessageRepository.findBySessionIdOrderByCreatedAtAsc(openSession.getId());
        markAdminRead(openSession, messages);
        return toMessageResponses(messages);
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponseDto> getMessagesForAdminSession(String adminLoginId, Long sessionId) {
        ensureAdmin(adminLoginId);

        ConsultationSession session = consultationSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found."));

        List<ConsultationMessage> messages =
                consultationMessageRepository.findBySessionIdOrderByCreatedAtAsc(session.getId());
        markAdminRead(session, messages);
        return toMessageResponses(messages);
    }

    @Transactional(readOnly = true)
    public List<ConsultationSessionResponseDto> getSessionsForUser(String userLoginId) {
        return consultationSessionRepository.findByUserLoginIdOrderByCreatedAtDesc(userLoginId).stream()
                .map(ConsultationSessionResponseDto::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ConsultationSessionResponseDto> getSessionsForAdminUser(String adminLoginId, String userLoginId) {
        ensureAdmin(adminLoginId);
        return consultationSessionRepository.findByUserLoginIdOrderByCreatedAtDesc(userLoginId).stream()
                .map(ConsultationSessionResponseDto::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public ConsultationSessionPageResponseDto getClosedSessionsForUser(String userLoginId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<ConsultationSession> sessionsPage = consultationSessionRepository.findByUserLoginIdAndStatus(
                userLoginId,
                ConsultationSessionStatus.CLOSED,
                pageable
        );
        return ConsultationSessionPageResponseDto.from(sessionsPage);
    }

    @Transactional(readOnly = true)
    public ConsultationSessionPageResponseDto getClosedSessionsForAdminUser(
            String adminLoginId,
            String userLoginId,
            int page,
            int size
    ) {
        ensureAdmin(adminLoginId);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<ConsultationSession> sessionsPage = consultationSessionRepository.findByUserLoginIdAndStatus(
                userLoginId,
                ConsultationSessionStatus.CLOSED,
                pageable
        );
        return ConsultationSessionPageResponseDto.from(sessionsPage);
    }

    @Transactional(readOnly = true)
    public ConsultationSessionResponseDto getCurrentSessionForUser(String userLoginId) {
        ConsultationSession session = consultationSessionRepository
                .findFirstByUserLoginIdAndStatusOrderByCreatedAtDesc(userLoginId, ConsultationSessionStatus.OPEN)
                .orElse(null);

        if (session == null) {
            return null;
        }

        return ConsultationSessionResponseDto.from(session);
    }

    public ConsultationSessionResponseDto startCurrentSessionByUser(String userLoginId) {
        Member user = getMember(userLoginId);
        if (user.getRole() == Role.ADMIN) {
            throw new IllegalArgumentException("Admin cannot start user consultation from this endpoint.");
        }

        ConsultationSession existingSession = consultationSessionRepository
                .findFirstByUserLoginIdAndStatusOrderByCreatedAtDesc(userLoginId, ConsultationSessionStatus.OPEN)
                .orElse(null);

        if (existingSession != null) {
            return ConsultationSessionResponseDto.from(existingSession);
        }

        ConsultationSession session = getOrCreateOpenSession(userLoginId);
        notifyConsultationStarted(user, session);
        return ConsultationSessionResponseDto.from(session);
    }

    public ConsultationSessionResponseDto closeCurrentSessionByUser(String userLoginId) {
        ConsultationSession session = consultationSessionRepository
                .findFirstByUserLoginIdAndStatusOrderByCreatedAtDesc(userLoginId, ConsultationSessionStatus.OPEN)
                .orElseThrow(() -> new IllegalArgumentException("Open consultation session not found."));

        session.close(userLoginId);
        Member user = getMember(userLoginId);
        notifyConsultationClosed(user, session);
        return ConsultationSessionResponseDto.from(session);
    }

    public ConsultationSessionResponseDto closeSessionByAdmin(String adminLoginId, Long sessionId) {
        ensureAdmin(adminLoginId);

        ConsultationSession session = consultationSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found."));

        session.close(adminLoginId);
        Member user = getMember(session.getUserLoginId());
        notifyConsultationClosed(user, session);
        return ConsultationSessionResponseDto.from(session);
    }

    @Transactional(readOnly = true)
    public List<ChatConversationSummaryDto> getConversationSummariesForAdmin(String adminLoginId) {
        ensureAdmin(adminLoginId);

        List<ConsultationSession> sessions = consultationSessionRepository.findAllByOrderByCreatedAtDesc();
        List<String> userLoginIds = sessions.stream()
                .map(ConsultationSession::getUserLoginId)
                .distinct()
                .toList();

        Map<String, String> currentNameByLoginId = memberRepository.findByLoginIdIn(userLoginIds).stream()
                .collect(Collectors.toMap(Member::getLoginId, Member::getName, (a, b) -> a));

        LinkedHashMap<String, ChatConversationSummaryDto> deduped = new LinkedHashMap<>();

        for (ConsultationSession session : sessions) {
            String key = session.getUserLoginId();
            if (deduped.containsKey(key)) {
                continue;
            }

            List<ConsultationMessage> messages = consultationMessageRepository.findBySessionIdOrderByCreatedAtAsc(session.getId());
            ConsultationMessage latestMessage = messages.isEmpty() ? null : messages.get(messages.size() - 1);

            deduped.put(key, ChatConversationSummaryDto.builder()
                    .userLoginId(key)
                    .userName(currentNameByLoginId.getOrDefault(key, session.getUserName()))
                    .lastMessage(latestMessage == null ? "" : latestMessage.getContent())
                    .lastMessageAt(latestMessage == null ? session.getCreatedAt() : latestMessage.getCreatedAt())
                    .unreadCount(countUnreadForAdmin(session))
                    .build());
        }

        return new ArrayList<>(deduped.values());
    }

    private void ensureAdmin(String loginId) {
        Member admin = getMember(loginId);
        if (admin.getRole() != Role.ADMIN) {
            throw new IllegalArgumentException("Only admin can access this resource.");
        }
    }

    private ConsultationSession getOrCreateOpenSession(String userLoginId) {
        return consultationSessionRepository
                .findFirstByUserLoginIdAndStatusOrderByCreatedAtDesc(userLoginId, ConsultationSessionStatus.OPEN)
                .orElseGet(() -> {
                    Member user = getMember(userLoginId);
                    Member admin = getMainAdmin();
                    return consultationSessionRepository.save(
                            ConsultationSession.builder()
                                    .userLoginId(user.getLoginId())
                                    .userName(user.getName())
                                    .adminLoginId(admin.getLoginId())
                                    .status(ConsultationSessionStatus.OPEN)
                                    .createdAt(LocalDateTime.now())
                                    .build()
                    );
                });
    }

    private Member getMainAdmin() {
        return memberRepository.findFirstByRole(Role.ADMIN)
                .orElseThrow(() -> new IllegalArgumentException("Admin account not found."));
    }

    private Member getMember(String loginId) {
        return memberRepository.findByLoginId(loginId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found."));
    }

    private void markAdminRead(ConsultationSession session, List<ConsultationMessage> messages) {
        LocalDateTime readAt = messages.isEmpty()
                ? LocalDateTime.now()
                : messages.get(messages.size() - 1).getCreatedAt();
        session.markAdminRead(readAt);
    }

    private long countUnreadForAdmin(ConsultationSession session) {
        if (session.getStatus() != ConsultationSessionStatus.OPEN) {
            return 0L;
        }

        if (session.getAdminLastReadAt() == null) {
            return consultationMessageRepository.countBySessionIdAndSenderLoginId(
                    session.getId(),
                    session.getUserLoginId()
            );
        }

        return consultationMessageRepository.countBySessionIdAndSenderLoginIdAndCreatedAtAfter(
                session.getId(),
                session.getUserLoginId(),
                session.getAdminLastReadAt()
        );
    }

    private List<ChatMessageResponseDto> toMessageResponses(List<ConsultationMessage> messages) {
        if (messages.isEmpty()) {
            return List.of();
        }

        List<String> loginIds = messages.stream()
                .flatMap(message -> List.of(message.getSenderLoginId(), message.getReceiverLoginId()).stream())
                .distinct()
                .toList();

        Map<String, String> nameByLoginId = memberRepository.findByLoginIdIn(loginIds).stream()
                .collect(Collectors.toMap(Member::getLoginId, Member::getName, (a, b) -> a));

        return messages.stream()
                .map(message -> toMessageResponse(
                        message,
                        nameByLoginId.getOrDefault(message.getSenderLoginId(), message.getSenderLoginId()),
                        nameByLoginId.getOrDefault(message.getReceiverLoginId(), message.getReceiverLoginId())
                ))
                .toList();
    }

    private ChatMessageResponseDto toMessageResponse(
            ConsultationMessage message,
            String senderName,
            String receiverName
    ) {
        return ChatMessageResponseDto.builder()
                .id(message.getId())
                .sessionId(message.getSessionId())
                .conversationUserLoginId(message.getConversationUserLoginId())
                .senderLoginId(message.getSenderLoginId())
                .senderName(senderName)
                .receiverLoginId(message.getReceiverLoginId())
                .receiverName(receiverName)
                .content(message.getContent())
                .createdAt(message.getCreatedAt())
                .build();
    }

    private void notifyConsultationStarted(Member user, ConsultationSession session) {
        try {
            consultationNotificationService.notifyConsultationReceived(
                    new ConsultationNotificationCommand(
                            user.getId(),
                            "상담 #" + session.getId(),
                            "1:1 상담 접수 안내",
                            "1:1 상담이 접수되었습니다. 관리자가 확인 후 답변드릴 예정입니다."
                    )
            );
        } catch (Exception exception) {
            log.warn(
                    "상담 접수 알림 발송 실패. sessionId={}, userId={}, cause={}",
                    session.getId(),
                    user.getId(),
                    exception.getMessage()
            );
        }
    }

    private void notifyConsultationClosed(Member user, ConsultationSession session) {
        try {
            consultationNotificationService.notifyConsultationAnswered(
                    new ConsultationNotificationCommand(
                            user.getId(),
                            "상담 #" + session.getId(),
                            "1:1 상담 종료 안내",
                            "1:1 상담이 종료되었습니다. 상담내용은 '마이페이지'에서 확인하실수 있습니다."
                    )
            );
        } catch (Exception exception) {
            log.warn(
                    "상담 종료 알림 발송 실패. sessionId={}, userId={}, cause={}",
                    session.getId(),
                    user.getId(),
                    exception.getMessage()
            );
        }
    }
}
