package cz.rob24dev.chatapp.server.dto.requests;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.ToString;

@Data
@ToString(exclude = "newPassword")
public class ResetPasswordRequest {

    @NotBlank
    private String token;
    @NotBlank @Size(min = 6, max = 50)
    private String newPassword;

    public ResetPasswordRequest(String token, String newPassword) {
        this.token = token;
        this.newPassword = newPassword;
    }
}
