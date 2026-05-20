package com.skinclinic.domain.notification.port;

import java.util.List;
import java.util.Optional;

public interface MemberNotificationReader {
    // 알림용 회원 정보 조회 인터페이스

    Optional<NotificationMemberInfo> findByMemberId(Long memberId);
    // 특정 회원 ID로 회원 정보를 조회, 해당 회원이 없을 수도 있기 때문에 Optional 사용.

    List<NotificationMemberInfo> findAll();
    // 전체 회원 목록을 조회
}