package cz.rob24dev.chatapp.server.dto;

import cz.rob24dev.chatapp.server.models.friends.FriendRequest;

public record FriendRequestDto(

    Long id,
    String name,
    String avatar,
    String note
) {

    public static FriendRequestDto from(FriendRequest fr, boolean isIncoming) {
        return new FriendRequestDto(
                fr.getId(),
                (isIncoming) ? fr.getSender().getName() : fr.getReceiver().getName(),
                (isIncoming) ? fr.getSender().getAvatarUrl() : fr.getReceiver().getAvatarUrl(),
                (isIncoming) ? fr.getSender().getStatusText() : fr.getReceiver().getStatusText()
        );
    }
}

