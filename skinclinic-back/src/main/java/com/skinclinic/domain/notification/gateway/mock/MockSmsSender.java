package com.skinclinic.domain.notification.gateway.mock;

import com.skinclinic.domain.notification.gateway.SmsSender;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(
        value = "notification.sms.provider",
        havingValue = "mock",
        matchIfMissing = true
)
public class MockSmsSender implements SmsSender {

    @Override
    public SmsSendResult send(String phone, String title, String message) {
        if (phone == null || phone.isBlank()) {
            return new SmsSendResult(false, "phone is empty");
        }
        return new SmsSendResult(true, "[MOCK_SMS] accepted");
    }
}
