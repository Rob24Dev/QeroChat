package cz.rob24dev.chatapp.server.dto.requests;

import lombok.Data;

@Data
public class EditChatRequest {

    String name;
    String icon;

    public EditChatRequest(String name, String icon) {
        this.name = name;
        this.icon = icon;
    }
}
