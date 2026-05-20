package com.skinclinic.global.auth.oauth;

import com.skinclinic.domain.member.entity.Member;
import com.skinclinic.domain.member.entity.Role;
import com.skinclinic.domain.member.entity.SocialProvider;
import com.skinclinic.domain.member.repository.MemberRepository;
import com.skinclinic.global.auth.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final DefaultOAuth2UserService delegate = new DefaultOAuth2UserService();

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = delegate.loadUser(userRequest);
        String registrationId = userRequest.getClientRegistration().getRegistrationId();

        if (!"kakao".equals(registrationId)) {
            throw new OAuth2AuthenticationException(new OAuth2Error("unsupported_provider"));
        }

        KakaoOAuth2Response kakao = new KakaoOAuth2Response(oauth2User.getAttributes());
        String providerId = kakao.getProviderId();
        String email = kakao.getEmail();

        if (providerId == null || providerId.isBlank()) {
            throw new OAuth2AuthenticationException(new OAuth2Error("missing_kakao_id"));
        }

        if (email == null || email.isBlank()) {
            throw new OAuth2AuthenticationException(new OAuth2Error("missing_kakao_email"));
        }

        Member socialMember = memberRepository.findBySocialProviderAndSocialId(SocialProvider.KAKAO, providerId)
                .orElse(null);

        if (socialMember != null && !socialMember.isDeleted()) {
            return new CustomUserDetails(socialMember, buildDefaultAttributes(oauth2User, socialMember));
        }

        Member emailMember = memberRepository.findByEmail(email).orElse(null);
        if (emailMember != null && !emailMember.isDeleted()) {
            emailMember.linkSocialAccount(SocialProvider.KAKAO, providerId);
            return new CustomUserDetails(emailMember, buildDefaultAttributes(oauth2User, emailMember));
        }

        return createPendingSignupUser(kakao, providerId, email);
    }

    private CustomUserDetails createPendingSignupUser(KakaoOAuth2Response kakao, String providerId, String email) {
        Member temporaryMember = Member.builder()
                .loginId("pending_kakao_" + providerId)
                .name(kakao.getName())
                .email(email)
                .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                .phone("")
                .role(Role.USER)
                .socialProvider(SocialProvider.KAKAO)
                .socialId(providerId)
                .build();

        Map<String, Object> attributes = new HashMap<>();
        attributes.put("signupRequired", true);
        attributes.put("socialProvider", "KAKAO");
        attributes.put("socialId", providerId);
        attributes.put("email", email);
        attributes.put("name", kakao.getName());

        return new CustomUserDetails(temporaryMember, attributes);
    }

    private Map<String, Object> buildDefaultAttributes(OAuth2User oauth2User, Member member) {
        Map<String, Object> attributes = new HashMap<>(oauth2User.getAttributes());
        attributes.put("loginId", member.getLoginId());
        return attributes;
    }
}
