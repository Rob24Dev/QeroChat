package cz.rob24dev.chatapp.server.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(value = HttpStatus.FORBIDDEN)
public class UnauthorizedToOperateException extends RuntimeException {

    public UnauthorizedToOperateException(String message) {
        super(message);
    }
}
