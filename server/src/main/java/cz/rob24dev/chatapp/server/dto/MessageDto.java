/*
 *
 * Copyright (c) 2026 Robert Darvaš. All rights reserved.
 *
 * Part of the QeroChat project.
 * Written by Rob24Dev <https://github.com/Rob24Dev>
 *
 */

package cz.rob24dev.chatapp.server.dto;

import cz.rob24dev.chatapp.server.models.conversation.Message;

import java.time.LocalDateTime;
import java.util.UUID;

public record MessageDto(
        UUID id,
        UUID authorId,
        String text,
        LocalDateTime createdAt,
        boolean edited
) {

    public static MessageDto from(Message m) {
        return new MessageDto(
                m.getId(),
                m.getAuthor().getId(),
                m.getText(),
                m.getCreatedAt(),
                m.isEdited()
        );
    }
}
