package cz.rob24dev.chatapp.server.dto.requests;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class NewFriendRequest {

    @NotBlank
    @Email
    private String email;

    public NewFriendRequest(String email) {
        this.email = email;
    }
}
