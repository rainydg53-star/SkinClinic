package com.skinclinic.domain.chat.dto;

import com.skinclinic.domain.chat.entity.ConsultationSession;
import com.skinclinic.domain.chat.entity.ConsultationSessionStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ConsultationSessionResponseDto {
    private Long id;
    private String userLoginId;
    private String userName;
    private String adminLoginId;
    private ConsultationSessionStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime closedAt;
    private String closedByLoginId;

    public static ConsultationSessionResponseDto from(ConsultationSession session) {
        return ConsultationSessionResponseDto.builder()
                .id(session.getId())
                .userLoginId(session.getUserLoginId())
                .userName(session.getUserName())
                .adminLoginId(session.getAdminLoginId())
                .status(session.getStatus())
                .createdAt(session.getCreatedAt())
                .closedAt(session.getClosedAt())
                .closedByLoginId(session.getClosedByLoginId())
                .build();
    }
}

