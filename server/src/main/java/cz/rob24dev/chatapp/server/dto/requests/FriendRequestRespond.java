package cz.rob24dev.chatapp.server.dto.requests;

import lombok.Data;

@Data
public class FriendRequestRespond {

    boolean accept;

    public FriendRequestRespond(boolean accept) {
        this.accept = accept;
    }
}
