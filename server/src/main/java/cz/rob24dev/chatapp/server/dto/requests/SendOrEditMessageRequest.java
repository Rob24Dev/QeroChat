package cz.rob24dev.chatapp.server.dto.requests;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SendOrEditMessageRequest {

    @NotBlank
    @Size(max = 1000)
    String text;

    public SendOrEditMessageRequest(String text) {
        this.text = text;
    }
}
