package com.skinclinic.global.config;

import com.skinclinic.global.auth.CustomUserDetails;
import com.skinclinic.global.auth.oauth.CustomOAuth2UserService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.http.HttpStatus;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomOAuth2UserService customOAuth2UserService;
    private final ObjectProvider<ClientRegistrationRepository> clientRegistrationRepositoryProvider;

    @Value("${app.frontend-url:http://localhost:5174}")
    private String frontendUrl;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/",
                                "/login",
                                "/logout",
                                "/oauth2/**",
                                "/login/oauth2/**",
                                "/api/auth/me",
                                "/api/members/signup",
                                "/api/members/find-id",
                                "/api/members/send-code",
                                "/api/members/verify-code",
                                "/api/members/reset",
                                "/api/chatbot/**",
                                "/api/procedures",
                                "/images/**",
                                "/api/procedures/**",
                                "/api/skin-diagnoses/**",
                                "/members/signup",
                                "/members/email/send",
                                "/members/email/verify")
                        .permitAll()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .anyRequest().authenticated())
                .formLogin(form -> form
                        .loginProcessingUrl("/login")
                        .successHandler((request, response, authentication) -> {
                            response.setStatus(HttpServletResponse.SC_OK);
                        })
                        .failureHandler((request, response, exception) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        }))
                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .clearAuthentication(true)
                        .invalidateHttpSession(true)
                        .deleteCookies("JSESSIONID")
                        .logoutSuccessHandler((request, response, authentication) -> {
                            response.setStatus(HttpServletResponse.SC_OK);
                        }))
                .exceptionHandling(exception -> exception
                        .defaultAuthenticationEntryPointFor(
                                new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED),
                                request -> request.getRequestURI().startsWith("/api/")
                        ));

        if (clientRegistrationRepositoryProvider.getIfAvailable() != null) {
            http.oauth2Login(oauth2 -> oauth2
                    .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
                    .successHandler((request, response, authentication) -> {
                        String socialSignupRedirect = buildSocialSignupRedirect(authentication);

                        if (socialSignupRedirect != null) {
                            new SecurityContextLogoutHandler().logout(request, response, authentication);
                            response.sendRedirect(socialSignupRedirect);
                            return;
                        }

                        response.sendRedirect(frontendUrl + "/");
                    })
                    .failureHandler((request, response, exception) -> response
                            .sendRedirect(frontendUrl + "/login?socialError=true")));
        }

        return http.build();
    }

    @Bean
    public static PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    private String buildSocialSignupRedirect(Authentication authentication) {
        if (!(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            return null;
        }

        if (!Boolean.TRUE.equals(userDetails.getAttributes().get("signupRequired"))) {
            return null;
        }

        return frontendUrl + "/signup?social=true"
                + "&provider=" + encode(userDetails.getAttributes().get("socialProvider"))
                + "&socialId=" + encode(userDetails.getAttributes().get("socialId"))
                + "&email=" + encode(userDetails.getAttributes().get("email"))
                + "&name=" + encode(userDetails.getAttributes().get("name"));
    }

    private String encode(Object value) {
        return URLEncoder.encode(value == null ? "" : String.valueOf(value), StandardCharsets.UTF_8);
    }
}
