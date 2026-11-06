/*
 *
 * Copyright (c) 2026 Robert Darvaš. All rights reserved.
 *
 * Part of the QeroChat project.
 * Written by Rob24Dev <https://github.com/Rob24Dev>
 *
 */

package cz.rob24dev.chatapp.server.dto.requests;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateChatRequest {

    @NotNull
    UUID contactId;
    @NotBlank
    String name;
    String icon;

    public CreateChatRequest(UUID contactId, String name, String icon) {
        this.contactId = contactId;
        this.name = name;
        this.icon = icon;
    }
}
