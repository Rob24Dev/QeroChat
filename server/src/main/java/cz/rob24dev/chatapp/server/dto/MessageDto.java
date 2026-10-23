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
