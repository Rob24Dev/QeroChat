package cz.rob24dev.chatapp.server.dto.requests;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ForgotPasswordRequest {

    @NotBlank
    @Email
    private String email;

    public ForgotPasswordRequest(String email) {
        this.email = email;
    }
}
