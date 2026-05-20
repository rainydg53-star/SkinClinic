package com.skinclinic.domain.notification.enumtype;

public enum FailureReason { // 실패 원인을 정리
    NONE,
    TOKEN_EXPIRED,
    AUTH_ERROR,
    TALK_MESSAGE_NOT_ALLOWED,
    NO_PHONE_NUMBER,
    UNKNOWN
}
