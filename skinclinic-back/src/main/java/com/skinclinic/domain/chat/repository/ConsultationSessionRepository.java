package com.skinclinic.domain.chat.repository;

import com.skinclinic.domain.chat.entity.ConsultationSession;
import com.skinclinic.domain.chat.entity.ConsultationSessionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ConsultationSessionRepository extends JpaRepository<ConsultationSession, Long> {
    Optional<ConsultationSession> findFirstByUserLoginIdAndStatusOrderByCreatedAtDesc(
            String userLoginId,
            ConsultationSessionStatus status
    );

    List<ConsultationSession> findByUserLoginIdOrderByCreatedAtDesc(String userLoginId);

    List<ConsultationSession> findByUserLoginIdAndStatusOrderByCreatedAtDesc(
            String userLoginId,
            ConsultationSessionStatus status
    );

    Page<ConsultationSession> findByUserLoginIdAndStatus(
            String userLoginId,
            ConsultationSessionStatus status,
            Pageable pageable
    );

    Optional<ConsultationSession> findByIdAndUserLoginId(Long id, String userLoginId);

    List<ConsultationSession> findByStatusOrderByCreatedAtDesc(ConsultationSessionStatus status);

    List<ConsultationSession> findAllByOrderByCreatedAtDesc();
}
