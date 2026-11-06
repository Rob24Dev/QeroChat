/*
 *
 * Copyright (c) 2026 Robert Darvaš. All rights reserved.
 *
 * Part of the QeroChat project.
 * Written by Rob24Dev <https://github.com/Rob24Dev>
 *
 */

package cz.rob24dev.chatapp.server.dto.responses;

import cz.rob24dev.chatapp.server.dto.UserDto;
import lombok.Data;

@Data
public class AuthorizationResponse {

    String token;
    UserDto user;

    public AuthorizationResponse(String token, UserDto user) {
        this.token = token;
        this.user = user;
    }
}
