package cz.rob24dev.chatapp.server.dto.requests;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ConfirmEmailRequest {

    @NotBlank
    private String token;

    public ConfirmEmailRequest(String token) {
        this.token = token;
    }
}
