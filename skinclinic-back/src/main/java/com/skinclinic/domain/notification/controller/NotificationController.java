package com.skinclinic.domain.notification.controller;

import com.skinclinic.global.auth.CustomUserDetails;
import com.skinclinic.domain.notification.dto.NotificationCreateRequest;
import com.skinclinic.domain.notification.dto.NotificationEventTriggerRequest;
import com.skinclinic.domain.notification.dto.MyNotificationTriggerRequest;
import com.skinclinic.domain.notification.dto.NotificationMemberResponse;
import com.skinclinic.domain.notification.dto.NotificationResponse;
import com.skinclinic.domain.notification.enumtype.NotificationType;
import com.skinclinic.domain.notification.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/notifications/users/{userId}")
    public List<NotificationResponse> getUserNotifications(
            @PathVariable Long userId,
            @RequestParam(required = false) NotificationType type
    ) {
        return notificationService.getUserNotifications(userId, type);
    }

    @GetMapping("/notifications/users/{userId}/unread-count")
    public Map<String, Long> getUnreadCount(@PathVariable Long userId) {
        return Map.of("unreadCount", notificationService.getUnreadCount(userId));
    }

    @PatchMapping("/notifications/{notificationId}/read")
    public NotificationResponse markAsRead(@PathVariable Long notificationId) {
        return notificationService.markAsRead(notificationId);
    }

    @PatchMapping("/notifications/{notificationId}/kakao-sent")
    public NotificationResponse markKakaoSent(@PathVariable Long notificationId) {
        return notificationService.markKakaoSent(notificationId);
    }

    @PostMapping("/notifications/me/test")
    public NotificationResponse triggerMyNotification(
            @RequestBody @Valid MyNotificationTriggerRequest request,
            Authentication authentication
    ) {
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken
                || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        return notificationService.triggerNotificationEvent(new NotificationEventTriggerRequest(
                userDetails.getMember().getId(),
                request.type(),
                request.title(),
                request.message(),
                request.eventReference()
        ));
    }

    @GetMapping("/admin/notifications")
    public List<NotificationResponse> getAllNotifications(
            @RequestParam(required = false) NotificationType type
    ) {
        return notificationService.getAllNotifications(type);
    }

    @GetMapping("/admin/notifications/members")
    public List<NotificationMemberResponse> getNotificationMembers() {
        return notificationService.getNotificationMembers();
    }

    @PostMapping("/admin/notifications")
    public NotificationResponse createNotification(@RequestBody @Valid NotificationCreateRequest request) {
        return notificationService.createNotification(request);
    }

    @PostMapping("/admin/notifications/events")
    public NotificationResponse triggerNotificationEvent(@RequestBody @Valid NotificationEventTriggerRequest request) {
        return notificationService.triggerNotificationEvent(request);
    }
}
