package cz.rob24dev.chatapp.server.dto;

import cz.rob24dev.chatapp.server.exceptions.ResourceNotFoundException;
import cz.rob24dev.chatapp.server.models.User;
import cz.rob24dev.chatapp.server.models.conversation.Chat;
import cz.rob24dev.chatapp.server.models.conversation.Contact;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ChatDto (
        @NotNull UUID id,
        @NotNull UUID contactId,
        String name,
        boolean global,
        int unread,
        String icon
) {

    public static ChatDto from(Chat ch, User requestor) {
        UUID contactId = null;
        for (Contact contact : requestor.getUserContacts()) {
            if(contact.getContactChats().contains(ch)) contactId = contact.getId();
        }
        if (contactId == null) throw new ResourceNotFoundException("Kontakt nebyl nalezen");

        return new ChatDto(
                ch.getId(),
                contactId,
                ch.getName(),
                ch.isGlobal(),
                ch.getUnread(),
                ch.getIconUrl()
        );
    }
}