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
public class FriendRequestRespond {

    boolean accept;

    public FriendRequestRespond(boolean accept) {
        this.accept = accept;
    }
}
