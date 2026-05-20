package com.skinclinic.domain.notification.gateway.solapi;

import com.skinclinic.domain.notification.gateway.SmsSender;
import com.solapi.sdk.message.model.Message;
import com.solapi.sdk.message.service.DefaultMessageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(value = "notification.sms.provider", havingValue = "solapi")
@Slf4j
public class SolapiSmsSender implements SmsSender {

    private final String apiKey;
    private final String apiSecret;
    private final String senderNumber;
    private final DefaultMessageService messageService;

    public SolapiSmsSender(
            @Value("${notification.sms.solapi.api-key:}") String apiKey,
            @Value("${notification.sms.solapi.api-secret:}") String apiSecret,
            @Value("${notification.sms.solapi.sender-number:}") String senderNumber,
            @Value("${notification.sms.solapi.domain:https://api.solapi.com}") String domain
    ) {
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        this.senderNumber = senderNumber;
        this.messageService = new DefaultMessageService(apiKey, apiSecret, domain);
        log.info(
                "Solapi SMS sender initialized. senderNumberPresent={}, apiKeyPresent={}, apiSecretPresent={}, domain={}",
                hasText(this.senderNumber),
                hasText(this.apiKey),
                hasText(this.apiSecret),
                domain
        );
    }

    @Override
    public SmsSendResult send(String phone, String title, String message) {
        if (phone == null || phone.isBlank()) {
            return new SmsSendResult(false, "휴대폰 번호가 없어 SMS 발송 불가");
        }

        if (apiKey.isBlank() || apiSecret.isBlank() || senderNumber.isBlank()) {
            return new SmsSendResult(false, "Solapi 설정이 누락되었습니다. API 키/시크릿/발신번호를 확인해주세요.");
        }

        try {
            String normalizedTo = normalizePhoneNumber(phone);
            String normalizedFrom = normalizePhoneNumber(senderNumber);
            log.info(
                    "Sending SMS via Solapi. to={}, from={}, title={}",
                    normalizedTo,
                    normalizedFrom,
                    title
            );

            Message sms = new Message();
            sms.setTo(normalizedTo);
            sms.setFrom(normalizedFrom);
            sms.setText(buildText(title, message));

            var response = messageService.send(sms);
            log.info("Solapi send response. response={}", response);

            if (response.getFailedMessageList() != null && !response.getFailedMessageList().isEmpty()) {
                var failed = response.getFailedMessageList().getFirst();
                return new SmsSendResult(false, "Solapi 발송 실패: " + failed.getStatusMessage());
            }

            return new SmsSendResult(true, "Solapi 요청 접수 완료(실제 수신은 통신사 처리 결과에 따라 달라질 수 있습니다)");
        } catch (Exception exception) {
            return new SmsSendResult(false, "Solapi 발송 예외: " + exception.getMessage());
        }
    }

    private String buildText(String title, String message) {
        if (title == null || title.isBlank()) {
            return message;
        }

        return "[" + title + "]\n" + message;
    }

    private String normalizePhoneNumber(String phone) {
        return phone.replaceAll("[^0-9]", "");
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
