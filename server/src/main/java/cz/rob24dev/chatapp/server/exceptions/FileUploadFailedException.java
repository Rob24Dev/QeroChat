package cz.rob24dev.chatapp.server.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(value = HttpStatus.BAD_REQUEST)
public class FileUploadFailedException extends RuntimeException {

    public FileUploadFailedException(String message) {
        super(message);
    }
}