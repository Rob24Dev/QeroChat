/*
 *
 * Copyright (c) 2026 Robert Darvaš. All rights reserved.
 *
 * Part of the QeroChat project.
 * Written by Rob24Dev <https://github.com/Rob24Dev>
 *
 */

package cz.rob24dev.chatapp.server.models.logs;

public enum LogType {
    REGISTER,
    LOGIN,
    RESET_PASSWORD_REQUEST,
    CHANGE_PASSWORD,
    CHANGE_EMAIL_REQUEST,
    CHANGE_EMAIL,
    FILE_UPLOAD,
    BETA_SIGN_UP,
    DELETE_ACCOUNT
}
