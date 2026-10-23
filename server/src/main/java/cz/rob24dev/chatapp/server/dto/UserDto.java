package cz.rob24dev.chatapp.server.dto;

import cz.rob24dev.chatapp.server.models.User;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record UserDto(
        @NotNull UUID id,
        String name,
        String email,
        String avatarUrl,
        String bannerUrl,
        List<BadgeDto> badges,
        LocalDateTime memberSince,
        String status,
        String statusText
) {
    public static UserDto from(User u) {
        return new UserDto(
                u.getId(),
                u.getName(),
                u.getEmail(),
                u.getAvatarUrl(),
                u.getBannerUrl(),
                u.getUserBadges().stream().map(BadgeDto::from).toList(),
                u.getMemberSince(),
                u.getStatus() == null ? "OFFLINE" : u.getStatus().name(),
                u.getStatusText()
        );
    }
}