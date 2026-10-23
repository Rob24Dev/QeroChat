package cz.rob24dev.chatapp.server.dto.requests;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.ToString;

@Data
@ToString(exclude = "password")
public class ChangeEmailRequest {

    @NotBlank
    @Email
    private String newEmail;
    @NotBlank @Size(min = 6, max = 50)
    private String password;

    public ChangeEmailRequest(String newEmail, String password) {
        this.newEmail = newEmail;
        this.password = password;
    }
}
