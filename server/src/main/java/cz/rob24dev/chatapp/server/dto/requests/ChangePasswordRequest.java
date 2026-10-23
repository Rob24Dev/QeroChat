package cz.rob24dev.chatapp.server.dto.requests;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.ToString;

@Data
@ToString(exclude = "newPassword")
public class ChangePasswordRequest {

    @NotBlank @Size(min = 6, max = 50)
    private String oldPassword;
    @NotBlank
    @Size(min = 6, max = 50)
    private String newPassword;

    public ChangePasswordRequest(String oldPassword, String newPassword) {
        this.oldPassword = oldPassword;
        this.newPassword = newPassword;
    }

}
