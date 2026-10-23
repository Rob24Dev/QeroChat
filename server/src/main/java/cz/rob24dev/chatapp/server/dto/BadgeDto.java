package cz.rob24dev.chatapp.server.dto;

import cz.rob24dev.chatapp.server.models.Badge;

public record BadgeDto(String icon, String title) {
    public static BadgeDto from(Badge b) {
        return new BadgeDto(b.getIcon(), b.getTitle());
    }
}