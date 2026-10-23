package cz.rob24dev.chatapp.server.dto.requests;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class BetaSignUpRequest {
    @NotBlank
    @Email
    private String email;
    private boolean agreeNews;
}
