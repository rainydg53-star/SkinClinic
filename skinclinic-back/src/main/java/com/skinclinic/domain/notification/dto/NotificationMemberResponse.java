package com.skinclinic.domain.notification.dto;

import com.skinclinic.domain.notification.enumtype.MemberType;

public record NotificationMemberResponse(
        Long memberId,
        String memberName,
        MemberType memberType,
        String phone,
        boolean kakaoLogin,
        boolean talkMessageAgreed,
        boolean hasAccessToken,
        boolean hasRefreshToken,
        String demoScenario
) {
}