/*
 *
 * Copyright (c) 2026 Robert Darvaš. All rights reserved.
 *
 * Part of the QeroChat project.
 * Written by Rob24Dev <https://github.com/Rob24Dev>
 *
 */

package cz.rob24dev.chatapp.server.dto;

import cz.rob24dev.chatapp.server.models.Badge;

public record BadgeDto(String icon, String title) {
    public static BadgeDto from(Badge b) {
        return new BadgeDto(b.getIcon(), b.getTitle());
    }
}