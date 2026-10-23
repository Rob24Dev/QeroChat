package cz.rob24dev.chatapp.server.controllers;

import cz.rob24dev.chatapp.server.config.WebConfig;
import cz.rob24dev.chatapp.server.dto.UserDto;
import cz.rob24dev.chatapp.server.dto.requests.AuthorizationRequest;
import cz.rob24dev.chatapp.server.dto.requests.ForgotPasswordRequest;
import cz.rob24dev.chatapp.server.dto.requests.ResetPasswordRequest;
import cz.rob24dev.chatapp.server.dto.responses.AuthorizationResponse;
import cz.rob24dev.chatapp.server.exceptions.BadCredentialsException;
import cz.rob24dev.chatapp.server.exceptions.BadRequestException;
import cz.rob24dev.chatapp.server.exceptions.ConflictException;
import cz.rob24dev.chatapp.server.models.User;
import cz.rob24dev.chatapp.server.models.logs.LogType;
import cz.rob24dev.chatapp.server.models.tokens.ActionToken;
import cz.rob24dev.chatapp.server.models.tokens.TokenType;
import cz.rob24dev.chatapp.server.services.*;
import cz.rob24dev.chatapp.server.services.tokens.ActionTokensService;
import cz.rob24dev.chatapp.server.services.tokens.HashManager;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1/auth")
public class AuthController {

    private final AuditLogsService auditLogsService;
    private final UserService userService;
    private final AuthorizationService authorizationService;
    private final WebConfig webConfig;
    private final ActionTokensService actionTokensService;
    public AuthController(UserService userService, AuthorizationService authorizationService, AuditLogsService auditLogsService, WebConfig webConfig, ActionTokensService actionTokensService) {
        this.userService = userService;
        this.authorizationService = authorizationService;
        this.auditLogsService = auditLogsService;
        this.webConfig = webConfig;
        this.actionTokensService = actionTokensService;
    }
    /*
    @Transactional
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody AuthorizationRequest authorizationRequest) {
        if(userService.getUserByEmail(authorizationRequest.getEmail()).isPresent()) {
            throw new ConflictException("E-mail je již zaregistrovaný!");
        }
        User user = new User();
        user.setName(authorizationRequest.getName());
        user.setEmail(authorizationRequest.getEmail());
        user.setPasswordHash(webConfig.passwordEncoder().encode(authorizationRequest.getPassword()));
        user = userService.save(user);

        auditLogsService.log(
                LogType.REGISTER,
                user.getId(),
                UUID.randomUUID().toString(),
                new HashMap<>()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(new AuthorizationResponse(authorizationService.generateToken(user.getId()), UserDto.from(user)));
    }*/

    @Transactional
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthorizationRequest authorizationRequest) {
        User user = userService.getUserByEmail(authorizationRequest.getEmail()).orElseThrow(() -> new BadCredentialsException("Neplatný e-mail, nebo heslo!"));
        if(webConfig.passwordEncoder().matches(authorizationRequest.getPassword(), user.getPasswordHash())) {
            String token = authorizationService.generateToken(user.getId());
            auditLogsService.log(
                    LogType.LOGIN,
                    user.getId(),
                    UUID.randomUUID().toString(),
                    new HashMap<>()
            );
            return ResponseEntity.status(HttpStatus.OK).body(new AuthorizationResponse(token, UserDto.from(user)));
        } else throw new BadCredentialsException("Neplatný e-mail, nebo heslo!");
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> resetPasswordRequest(@Valid @RequestBody ForgotPasswordRequest forgotPasswordRequest) {
        User user = userService.getUserByEmail(forgotPasswordRequest.getEmail()).orElse(null);
        if(user == null) return ResponseEntity.ok(Map.of("message", "Pokud e-mail existuje, byl na něj zaslán odkaz na reset hesla."));

        auditLogsService.log(
                LogType.RESET_PASSWORD_REQUEST,
                user.getId(),
                UUID.randomUUID().toString(),
                new HashMap<>()
        );
        actionTokensService.actionRequest(user, TokenType.RESET_PASSWORD, new HashMap<>());

        return ResponseEntity.ok(Map.of("message", "Pokud e-mail existuje, byl na něj zaslán odkaz na reset hesla."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest resetPasswordRequest) {
        String tokenHash =  HashManager.hashText(resetPasswordRequest.getToken());
        ActionToken actionToken = actionTokensService.getActionTokenByTokenHash(tokenHash).orElse(null);
        if(actionToken == null || actionToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Neplatný token!");
        }
        if(actionToken.isUsed()) {
            throw new ConflictException("Token byl již použit!");

        }
        actionToken.setMetadata(actionTokensService.getMetadataJsonFromMap(Map.of("newData", resetPasswordRequest.getNewPassword())));
        actionTokensService.useToken(actionToken);
        return ResponseEntity.ok(Map.of("message", "Reset hesla proběhl úspěšně."));
    }
}
