package cz.rob24dev.chatapp.server.dto;

import cz.rob24dev.chatapp.server.models.User;
import cz.rob24dev.chatapp.server.models.conversation.Contact;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record ContactDto(
        @NotNull UUID id,
        String name,
        String email,
        String avatarUrl,
        String bannerUrl,
        List<BadgeDto> badges,
        LocalDateTime memberSince,
        String status,
        String statusText,
        boolean blocked,
        boolean blockedMe,
        boolean removed,
        boolean removedMe,
        int unread
) {

    public static ContactDto from(Contact c) {
        User u = c.getContactUser();
        return new ContactDto(
                c.getId(),
                u.getName(),
                u.getEmail(),
                u.getAvatarUrl(),
                u.getBannerUrl(),
                u.getUserBadges().stream().map(BadgeDto::from).toList(),
                u.getMemberSince(),
                u.getStatus() == null ? "OFFLINE" : u.getStatus().name(),
                u.getStatusText(),
                c.isBlocked(),
                c.isBlockedMe(),
                c.isRemoved(),
                c.isRemovedMe(),
                c.getUnread()
        );
    }
}