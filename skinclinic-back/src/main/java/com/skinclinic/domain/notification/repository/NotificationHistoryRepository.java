package com.skinclinic.domain.notification.repository;

import com.skinclinic.domain.notification.entity.NotificationHistory;
import com.skinclinic.domain.notification.enumtype.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationHistoryRepository extends JpaRepository<NotificationHistory, Long> {
   // 알림 이력(NotificationHistory) 엔티티를 저장/조회하는 JPA Repository

    List<NotificationHistory> findByUserIdOrderByCreatedAtDesc(Long userId);
    // 특정 사용자의 알림 목록을 생성일시 내림차순으로 조회

    List<NotificationHistory> findByUserIdAndTypeOrderByCreatedAtDesc(Long userId, NotificationType type);
    // 특정 사용자의 특정 알림 유형만 최신순으로 조회

    List<NotificationHistory> findByTypeOrderByCreatedAtDesc(NotificationType type);
    // 특정 알림 유형 전체를 최신순으로 조회

    long countByUserIdAndIsReadFalse(Long userId);
    // 특정 사용자의 읽지 않은 알림 개수
}