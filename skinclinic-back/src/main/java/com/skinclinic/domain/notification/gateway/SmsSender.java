package com.skinclinic.domain.notification.gateway;

public interface SmsSender {
// SMS 발송 기능을 추상화한 인터페이스

    SmsSendResult send(String phone, String title, String message);
    // 문자를 발송하는 메서드

    record SmsSendResult(boolean success, String detail) {
        // 문자 발송 결과를 담는 record
    }
}