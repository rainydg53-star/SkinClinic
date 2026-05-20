package com.skinclinic.domain.notification.port.mock;

import com.skinclinic.domain.notification.enumtype.MemberType;
import com.skinclinic.domain.notification.port.MemberNotificationReader;
import com.skinclinic.domain.notification.port.NotificationMemberInfo;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class MockMemberNotificationReader implements MemberNotificationReader {
// 실제 회원 테이블 대신, 메모리에 저장된 더미 회원 정보를 반환하는 구현체

    private final ConcurrentHashMap<Long, NotificationMemberInfo> store = new ConcurrentHashMap<>();

    @PostConstruct
    void init() {
        store.put(1L, new NotificationMemberInfo(
                // 회원 1번
                1L,
                "김민지",
                "010-3089-4791",
                MemberType.GENERAL,
                false,
                false,
                null,
                null,
                null,
                "일반회원: SMS 자동 발송"
        ));

        store.put(2L, new NotificationMemberInfo(
                // 회원 2번
                2L,
                "이서연",
                "010-2222-2222",
                MemberType.GENERAL,
                false,
                false,
                null,
                null,
                null,
                "일반회원: SMS 자동 발송"
        ));

        store.put(3L, new NotificationMemberInfo(
                // 회원 3번
                3L,
                "박지훈",
                "010-3333-3333",
                MemberType.GENERAL,
                false,
                false,
                null,
                null,
                null,
                "일반회원: 예약 알림 수신"
        ));

        store.put(4L, new NotificationMemberInfo(
                // 회원 4번
                4L,
                "최나래",
                "010-4444-4444",
                MemberType.GENERAL,
                false,
                false,
                null,
                null,
                null,
                "일반회원: 결제 알림 수신"
        ));

        store.put(5L, new NotificationMemberInfo(
                // 회원 5번
                5L,
                "정하늘",
                "010-5555-5555",
                MemberType.GENERAL,
                false,
                false,
                null,
                null,
                null,
                "일반회원: 상담 알림 수신"
        ));
    }

    @Override
    public Optional<NotificationMemberInfo> findByMemberId(Long memberId) {
        // Map에서 memberId로 조회
        return Optional.ofNullable(store.get(memberId));
    }

    @Override
    public List<NotificationMemberInfo> findAll() {
        // 전체 회원 목록을 반환, memberId 기준 오름차순
        return store.values().stream()
                .sorted((a, b) -> Long.compare(a.memberId(), b.memberId()))
                .toList();
    }
}
