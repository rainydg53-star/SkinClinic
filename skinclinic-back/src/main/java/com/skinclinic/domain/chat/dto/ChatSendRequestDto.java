package com.skinclinic.domain.chat.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ChatSendRequestDto {

    private String toLoginId;

    @NotBlank(message = "Message content is required.")
    private String content;
}

