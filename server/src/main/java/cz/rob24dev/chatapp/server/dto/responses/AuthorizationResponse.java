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
