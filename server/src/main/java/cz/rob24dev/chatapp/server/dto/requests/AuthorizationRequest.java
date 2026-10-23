package cz.rob24dev.chatapp.server.dto.requests;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.ToString;

@Data
@ToString(exclude = "password")
public class AuthorizationRequest {

    @Size(min = 3, max = 20)
    private String name;
    @NotBlank
    @Email
    private String email;
    @NotBlank @Size(min = 6, max = 50)
    private String password;

    public AuthorizationRequest(String name, String email, String password) {
        this.name = name;
        this.email = email;
        this.password = password;
    }
}
