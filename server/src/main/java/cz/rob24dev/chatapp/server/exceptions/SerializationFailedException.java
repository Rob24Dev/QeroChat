package cz.rob24dev.chatapp.server.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(value = HttpStatus.INTERNAL_SERVER_ERROR)
public class SerializationFailedException extends RuntimeException {

    public SerializationFailedException(String message) {
        super(message);
    }
}
