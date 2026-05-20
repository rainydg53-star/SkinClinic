package com.skinclinic.domain.notification.port.db;

import com.skinclinic.domain.member.entity.Member;
import com.skinclinic.domain.member.entity.SocialProvider;
import com.skinclinic.domain.member.repository.MemberRepository;
import com.skinclinic.domain.notification.enumtype.MemberType;
import com.skinclinic.domain.notification.port.MemberNotificationReader;
import com.skinclinic.domain.notification.port.NotificationMemberInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Primary;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.core.OAuth2RefreshToken;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

@Primary
@Component
@RequiredArgsConstructor
public class DbMemberNotificationReader implements MemberNotificationReader {

    private final MemberRepository memberRepository;
    private final ObjectProvider<OAuth2AuthorizedClientService> oAuth2AuthorizedClientServiceProvider;

    @Override
    public Optional<NotificationMemberInfo> findByMemberId(Long memberId) {
        return memberRepository.findById(memberId)
                .filter(member -> !member.isDeleted())
                .map(this::toNotificationMemberInfo);
    }

    @Override
    public List<NotificationMemberInfo> findAll() {
        return memberRepository.findAll().stream()
                .filter(member -> !member.isDeleted())
                .map(this::toNotificationMemberInfo)
                .toList();
    }

    private NotificationMemberInfo toNotificationMemberInfo(Member member) {
        boolean isKakaoMember = member.getSocialProvider() == SocialProvider.KAKAO;
        OAuth2AuthorizedClient authorizedClient = loadKakaoAuthorizedClient(member);

        OAuth2AccessToken accessToken = authorizedClient == null ? null : authorizedClient.getAccessToken();
        OAuth2RefreshToken refreshToken = authorizedClient == null ? null : authorizedClient.getRefreshToken();

        String accessTokenValue = accessToken == null ? null : accessToken.getTokenValue();
        String refreshTokenValue = refreshToken == null ? null : refreshToken.getTokenValue();
        LocalDateTime accessTokenExpiresAt = accessToken == null || accessToken.getExpiresAt() == null
                ? null
                : LocalDateTime.ofInstant(accessToken.getExpiresAt(), ZoneId.systemDefault());
        boolean talkMessageAgreed = accessToken != null && accessToken.getScopes().contains("talk_message");

        return new NotificationMemberInfo(
                member.getId(),
                member.getName(),
                member.getPhone(),
                isKakaoMember ? MemberType.KAKAO : MemberType.GENERAL,
                isKakaoMember,
                talkMessageAgreed,
                accessTokenValue,
                refreshTokenValue,
                accessTokenExpiresAt,
                isKakaoMember
                        ? "social login member - kakao preferred mode"
                        : "general member - sms mode"
        );
    }

    private OAuth2AuthorizedClient loadKakaoAuthorizedClient(Member member) {
        OAuth2AuthorizedClientService service = oAuth2AuthorizedClientServiceProvider.getIfAvailable();
        if (service == null || member.getLoginId() == null || member.getLoginId().isBlank()) {
            return null;
        }
        return service.loadAuthorizedClient("kakao", member.getLoginId());
    }
}
