package com.skinclinic.domain.notification.gateway.kakao;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skinclinic.domain.notification.enumtype.FailureReason;
import com.skinclinic.domain.notification.gateway.KakaoMessageSender;
import com.skinclinic.domain.notification.port.NotificationMemberInfo;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Map;

@Component
@ConditionalOnProperty(value = "notification.kakao.provider", havingValue = "rest")
@Slf4j
public class RestKakaoMessageSender implements KakaoMessageSender {

    private static final String DEV_NOTIFICATION_URL = "http://192.168.219.100:5173/mypage/notifications";
    private static final String DEFAULT_BUTTON_TITLE = "알림 확인하기";

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String webUrl;
    private final String mobileWebUrl;
    private final String buttonTitle;

    public RestKakaoMessageSender(
            ObjectMapper objectMapper,
            @Value("${notification.kakao.message-api-base-url:https://kapi.kakao.com}") String baseUrl,
            @Value("${notification.kakao.web-url:http://localhost:5174/mypage/notifications}") String webUrl,
            @Value("${notification.kakao.mobile-web-url:http://localhost:5174/mypage/notifications}") String mobileWebUrl,
            @Value("${notification.kakao.button-title:Open Notification}") String buttonTitle) {
        this.objectMapper = objectMapper;
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
        this.webUrl = normalizeNotificationUrl(webUrl);
        this.mobileWebUrl = normalizeNotificationUrl(mobileWebUrl);
        this.buttonTitle = sanitizeButtonTitle(buttonTitle);

        log.info("Kakao message sender initialized. webUrl={}, mobileWebUrl={}, buttonTitle={}",
                this.webUrl, this.mobileWebUrl, this.buttonTitle);
    }

    @Override
    public KakaoSendResult sendToMe(NotificationMemberInfo memberInfo, String title, String message) {
        if (!memberInfo.kakaoLogin()) {
            return new KakaoSendResult(false, FailureReason.AUTH_ERROR, "카카오 로그인이 필요합니다.");
        }
        if (!memberInfo.talkMessageAgreed()) {
            return new KakaoSendResult(false, FailureReason.TALK_MESSAGE_NOT_ALLOWED, "talk_message 동의가 필요합니다.");
        }
        if (!memberInfo.hasAccessToken()) {
            return new KakaoSendResult(false, FailureReason.AUTH_ERROR, "access token 이 없습니다.");
        }
        if (memberInfo.isAccessTokenExpired()) {
            return new KakaoSendResult(false, FailureReason.TOKEN_EXPIRED, "access token 이 만료되었습니다.");
        }

        try {
            String templateObject = buildTemplateObject(title, message);
            LinkedMultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("template_object", templateObject);

            Map<?, ?> response = restClient.post()
                    .uri("/v2/api/talk/memo/default/send")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .header("Authorization", "Bearer " + memberInfo.accessToken())
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            log.info("Kakao memo response. memberId={}, response={}", memberInfo.memberId(), response);

            Object resultCode = response == null ? null : response.get("result_code");
            if (resultCode instanceof Number number && number.intValue() == 0) {
                return new KakaoSendResult(true, FailureReason.NONE, "카카오 메시지 전송 성공");
            }

            return new KakaoSendResult(false, FailureReason.UNKNOWN, "카카오 메시지 응답이 올바르지 않습니다.");
        } catch (RestClientResponseException exception) {
            return new KakaoSendResult(false, mapFailureReason(exception),
                    "카카오 메시지 발송 실패: " + exception.getResponseBodyAsString());
        } catch (Exception exception) {
            return new KakaoSendResult(false, FailureReason.UNKNOWN,
                    "카카오 메시지 발송 예외: " + exception.getMessage());
        }
    }

    private String buildTemplateObject(String title, String message) throws JsonProcessingException {
        String trackedWebUrl = appendTrackingQuery(webUrl);
        String trackedMobileWebUrl = appendTrackingQuery(mobileWebUrl);

        String textWithDirectUrl = "[" + title + "]\n" + message + "\n\n알림 링크:\n" + trackedMobileWebUrl;

        Map<String, Object> template = Map.of(
                "object_type", "text",
                "text", textWithDirectUrl,
                "link", Map.of(
                        "web_url", trackedWebUrl,
                        "mobile_web_url", trackedMobileWebUrl),
                "buttons", java.util.List.of(
                        Map.of(
                                "title", buttonTitle,
                                "link", Map.of(
                                        "web_url", trackedWebUrl,
                                        "mobile_web_url", trackedMobileWebUrl))));

        return objectMapper.writeValueAsString(template);
    }

    private String appendTrackingQuery(String url) {
        String separator = url.contains("?") ? "&" : "?";
        String source = URLEncoder.encode("kakao", StandardCharsets.UTF_8);
        String timestamp = String.valueOf(Instant.now().toEpochMilli());
        return url + separator + "from=" + source + "&t=" + timestamp;
    }

    private String normalizeNotificationUrl(String url) {
        if (url == null || url.isBlank() || url.contains("localhost")) {
            log.warn("Kakao notification URL '{}' is not reachable on mobile. Falling back to {}", url,
                    DEV_NOTIFICATION_URL);
            return DEV_NOTIFICATION_URL;
        }
        return url;
    }

    private String sanitizeButtonTitle(String configuredTitle) {
        if (configuredTitle == null || configuredTitle.isBlank()) {
            return DEFAULT_BUTTON_TITLE;
        }

        // If env value is mojibake-like, replace with safe Korean label.
        if (configuredTitle.contains("?") || configuredTitle.contains("�")) {
            log.warn("Kakao button title looks corrupted. fallbackTitle={}", DEFAULT_BUTTON_TITLE);
            return DEFAULT_BUTTON_TITLE;
        }
        return configuredTitle;
    }

    private FailureReason mapFailureReason(RestClientResponseException exception) {
        if (exception.getStatusCode().value() == 401) {
            return FailureReason.AUTH_ERROR;
        }
        if (exception.getStatusCode().value() == 403) {
            return FailureReason.TALK_MESSAGE_NOT_ALLOWED;
        }
        return FailureReason.UNKNOWN;
    }
}
