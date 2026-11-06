/*
 *
 * Copyright (c) 2026 Robert Darvaš. All rights reserved.
 *
 * Part of the QeroChat project.
 * Written by Rob24Dev <https://github.com/Rob24Dev>
 *
 */

package cz.rob24dev.chatapp.server.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(value = HttpStatus.UNAUTHORIZED)
public class BadCredentialsException extends RuntimeException {

    public BadCredentialsException(String message) {
        super(message);
    }
}
