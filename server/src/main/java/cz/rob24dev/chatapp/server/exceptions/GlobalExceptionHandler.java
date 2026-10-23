package cz.rob24dev.chatapp.server.exceptions;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.Map;

@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, String>> handleBadCredentialsException(BadCredentialsException ex) {
        return new ResponseEntity<>(Map.of("message", ex.getMessage()), HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<Map<String, String>> handleConflictException(ConflictException ex) {
        return new ResponseEntity<>(Map.of("message", ex.getMessage()), HttpStatus.CONFLICT);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleResourceNotFoundException(ResourceNotFoundException ex) {
        return new ResponseEntity<>(Map.of("message", ex.getMessage()), HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(UnauthorizedToOperateException.class)
    public ResponseEntity<Map<String, String>> handleUnauthorizedToOperateException(UnauthorizedToOperateException ex) {
        return new ResponseEntity<>(Map.of("message", ex.getMessage()), HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<Map<String, String>> handleBadRequestException(BadRequestException ex) {
        return new ResponseEntity<>(Map.of("message", ex.getMessage()), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGeneralException(Exception ex) {
        log.error("Something went wrong: {}", ex.getMessage());
        return new ResponseEntity<>(Map.of("message", "Omlouváme se, ale nastala neočekávaná chyba. Zkuste to prosím později."), HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(FileUploadFailedException.class)
    public ResponseEntity<Map<String, String>> handleFileUploadFailedException(FileUploadFailedException ex) {
        return new ResponseEntity<>(Map.of("message", ex.getMessage()), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, String>> handleMaxUploadSizeExceededException() {
        return new ResponseEntity<>(Map.of("message", "Soubor je moc velký."), HttpStatus.BAD_REQUEST);
    }
}