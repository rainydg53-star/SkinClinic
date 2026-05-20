package com.skinclinic.global.auth.controller;

import com.skinclinic.global.auth.dto.AuthCheckResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AuthController {

    @GetMapping("/api/auth/me")
    public ResponseEntity<AuthCheckResponse> me(Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            AuthCheckResponse unauthenticatedResponse = AuthCheckResponse.builder()
                    .authenticated(false)
                    .build();
            return ResponseEntity.ok(unauthenticatedResponse);
        }

        String loginId = authentication.getName();

        String role = authentication.getAuthorities().stream()
                .findFirst()
                .map(authority -> authority.getAuthority())
                .orElse("ROLE_USER");

        AuthCheckResponse response = AuthCheckResponse.builder()
                .authenticated(true)
                .loginId(loginId)
                .role(role)
                .build();

        return ResponseEntity.ok(response);
    }
}