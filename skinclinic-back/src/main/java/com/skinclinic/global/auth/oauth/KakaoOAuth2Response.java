package com.skinclinic.global.auth.oauth;

import java.util.Map;

public class KakaoOAuth2Response {
    private final Map<String, Object> attributes;

    public KakaoOAuth2Response(Map<String, Object> attributes) {
        this.attributes = attributes;
    }

    public String getProviderId() {
        Object id = attributes.get("id");
        return id == null ? null : String.valueOf(id);
    }

    public String getEmail() {
        Map<String, Object> account = getMap(attributes, "kakao_account");
        Object email = account.get("email");
        return email == null ? null : String.valueOf(email);
    }

    public String getName() {
        Map<String, Object> properties = getMap(attributes, "properties");
        Object nickname = properties.get("nickname");
        return nickname == null ? "Kakao User" : String.valueOf(nickname);
    }

    private Map<String, Object> getMap(Map<String, Object> source, String key) {
        Object value = source.get(key);
        if (value instanceof Map<?, ?> map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> casted = (Map<String, Object>) map;
            return casted;
        }
        return Map.of();
    }
}
