package com.skinclinic.domain.notification.gateway.kakao;

import com.skinclinic.domain.notification.gateway.KakaoTokenRefresher;
import com.skinclinic.domain.notification.port.NotificationMemberInfo;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.time.LocalDateTime;
import java.util.Map;

@Component
@ConditionalOnProperty(value = "notification.kakao.provider", havingValue = "rest")
public class RestKakaoTokenRefresher implements KakaoTokenRefresher {

    private final RestClient restClient;
    private final String restApiKey;
    private final String clientSecret;

    public RestKakaoTokenRefresher(
            @Value("${notification.kakao.auth-api-base-url:https://kauth.kakao.com}") String baseUrl,
            @Value("${notification.kakao.rest-api-key:}") String restApiKey,
            @Value("${notification.kakao.client-secret:}") String clientSecret
    ) {
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .build();
        this.restApiKey = restApiKey;
        this.clientSecret = clientSecret;
    }

    @Override
    public KakaoTokenRefreshResult refresh(NotificationMemberInfo memberInfo) {
        if (!memberInfo.hasRefreshToken()) {
            return new KakaoTokenRefreshResult(false, null, null, "refresh token 이 없습니다.");
        }

        if (restApiKey.isBlank()) {
            return new KakaoTokenRefreshResult(false, null, null, "카카오 REST API 키가 설정되지 않았습니다.");
        }

        try {
            LinkedMultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("grant_type", "refresh_token");
            body.add("client_id", restApiKey);
            body.add("refresh_token", memberInfo.refreshToken());

            if (!clientSecret.isBlank()) {
                body.add("client_secret", clientSecret);
            }

            Map<?, ?> response = restClient.post()
                    .uri("/oauth/token")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            String accessToken = asString(response == null ? null : response.get("access_token"));
            Number expiresIn = response != null && response.get("expires_in") instanceof Number number ? number : null;

            if (accessToken == null || expiresIn == null) {
                return new KakaoTokenRefreshResult(false, null, null, "카카오 토큰 재발급 응답이 올바르지 않습니다.");
            }

            return new KakaoTokenRefreshResult(
                    true,
                    accessToken,
                    LocalDateTime.now().plusSeconds(expiresIn.longValue()),
                    "카카오 access token 재발급 성공"
            );
        } catch (RestClientResponseException exception) {
            return new KakaoTokenRefreshResult(false, null, null, "카카오 토큰 재발급 실패: " + exception.getResponseBodyAsString());
        } catch (Exception exception) {
            return new KakaoTokenRefreshResult(false, null, null, "카카오 토큰 재발급 예외: " + exception.getMessage());
        }
    }

    private String asString(Object value) {
        return value == null ? null : String.valueOf(value);
    }
}
