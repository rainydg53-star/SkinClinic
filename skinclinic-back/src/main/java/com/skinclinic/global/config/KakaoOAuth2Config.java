package com.skinclinic.global.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.InMemoryOAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;

@Configuration
public class KakaoOAuth2Config {

    @Bean
    @ConditionalOnExpression("'${kakao.client-id:}' != ''")
    public ClientRegistrationRepository clientRegistrationRepository(
            @Value("${kakao.client-id}") String clientId,
            @Value("${kakao.client-secret:}") String clientSecret
    ) {
        ClientAuthenticationMethod authenticationMethod = hasText(clientSecret)
                ? ClientAuthenticationMethod.CLIENT_SECRET_POST
                : ClientAuthenticationMethod.NONE;

        ClientRegistration.Builder builder = ClientRegistration.withRegistrationId("kakao")
                .clientId(clientId)
                .clientName("Kakao")
                .clientAuthenticationMethod(authenticationMethod)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
                .scope("profile_nickname", "account_email", "talk_message")
                .authorizationUri("https://kauth.kakao.com/oauth/authorize")
                .tokenUri("https://kauth.kakao.com/oauth/token")
                .userInfoUri("https://kapi.kakao.com/v2/user/me")
                .userNameAttributeName("id");

        if (hasText(clientSecret)) {
            builder.clientSecret(clientSecret);
        }

        ClientRegistration kakaoRegistration = builder.build();

        return new InMemoryClientRegistrationRepository(kakaoRegistration);
    }

    @Bean
    @ConditionalOnExpression("'${kakao.client-id:}' != ''")
    public OAuth2AuthorizedClientService authorizedClientService(
            ClientRegistrationRepository clientRegistrationRepository
    ) {
        return new InMemoryOAuth2AuthorizedClientService(clientRegistrationRepository);
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
