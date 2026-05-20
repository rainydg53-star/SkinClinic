package com.skinclinic.global.websocket;

import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.simp.user.SimpUser;
import org.springframework.messaging.simp.user.SimpUserRegistry;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.stereotype.Component;

import java.security.Principal;

@Component
@Slf4j
@RequiredArgsConstructor
public class WebSocketSessionLimitInterceptor implements ChannelInterceptor {

    private final ObjectProvider<SimpUserRegistry> simpUserRegistryProvider;

    @Value("${app.chat.max-websocket-sessions-per-user:2}")
    private int maxSessionsPerUser;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
        if (accessor.getCommand() != StompCommand.CONNECT) {
            return message;
        }

        Principal principal = accessor.getUser();
        if (principal == null) {
            return message;
        }

        SimpUserRegistry simpUserRegistry = simpUserRegistryProvider.getIfAvailable();
        if (simpUserRegistry == null) {
            return message;
        }

        SimpUser user = simpUserRegistry.getUser(principal.getName());
        int currentSessionCount = user == null ? 0 : user.getSessions().size();

        if (currentSessionCount >= maxSessionsPerUser) {
            log.warn(
                    "SESSION_LIMIT_EXCEEDED user={} currentSessions={} maxAllowed={}",
                    principal.getName(),
                    currentSessionCount,
                    maxSessionsPerUser
            );
            throw new IllegalStateException(
                    "SESSION_LIMIT_EXCEEDED: maxWebSocketSessionsPerUser=" + maxSessionsPerUser
            );
        }

        return message;
    }
}
