package com.skinclinic.domain.chat.repository;

import com.skinclinic.domain.chat.entity.ConsultationMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface ConsultationMessageRepository extends JpaRepository<ConsultationMessage, Long> {
    List<ConsultationMessage> findByConversationUserLoginIdOrderByCreatedAtAsc(String conversationUserLoginId);

    List<ConsultationMessage> findBySessionIdOrderByCreatedAtAsc(Long sessionId);

    List<ConsultationMessage> findAllByOrderByCreatedAtDesc();

    long countBySessionIdAndSenderLoginId(Long sessionId, String senderLoginId);

    long countBySessionIdAndSenderLoginIdAndCreatedAtAfter(Long sessionId, String senderLoginId, LocalDateTime createdAt);
}
