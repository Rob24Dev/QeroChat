/*
 *
 * Copyright (c) 2026 Robert Darvaš. All rights reserved.
 *
 * Part of the QeroChat project.
 * Written by Rob24Dev <https://github.com/Rob24Dev>
 *
 */

package cz.rob24dev.chatapp.server.dto.requests;

import lombok.Data;

@Data
public class EditChatRequest {

    String name;
    String icon;

    public EditChatRequest(String name, String icon) {
        this.name = name;
        this.icon = icon;
    }
}
