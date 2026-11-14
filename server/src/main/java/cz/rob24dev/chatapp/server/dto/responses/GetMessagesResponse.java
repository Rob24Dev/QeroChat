/*
 *
 * Copyright (c) 2026 Robert Darvaš. All rights reserved.
 *
 * Part of the QeroChat project.
 * Written by Rob24Dev <https://github.com/Rob24Dev>
 *
 */

package cz.rob24dev.chatapp.server.dto.responses;

import cz.rob24dev.chatapp.server.dto.MessageDto;
import lombok.Data;

import java.util.List;

@Data
public class GetMessagesResponse {

    List<MessageDto> messages;
    boolean hasMore;

    public GetMessagesResponse(List<MessageDto> messages, boolean hasMore) {
        this.messages = messages;
        this.hasMore = hasMore;
    }
}
