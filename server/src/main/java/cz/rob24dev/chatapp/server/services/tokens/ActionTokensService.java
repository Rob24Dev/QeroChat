package cz.rob24dev.chatapp.server.services.tokens;

import cz.rob24dev.chatapp.server.config.WebConfig;
import cz.rob24dev.chatapp.server.exceptions.BadRequestException;
import cz.rob24dev.chatapp.server.exceptions.ConflictException;
import cz.rob24dev.chatapp.server.exceptions.SerializationFailedException;
import cz.rob24dev.chatapp.server.models.tokens.ActionToken;
import cz.rob24dev.chatapp.server.models.User;
import cz.rob24dev.chatapp.server.models.logs.LogType;
import cz.rob24dev.chatapp.server.models.tokens.TokenType;
import cz.rob24dev.chatapp.server.repositories.ActionTokensRepository;
import cz.rob24dev.chatapp.server.services.AuditLogsService;
import cz.rob24dev.chatapp.server.services.EmailSenderService;
import cz.rob24dev.chatapp.server.services.UserService;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;

@Service
@Slf4j
public class ActionTokensService {

    private final ActionTokensRepository actionTokensRepository;
    private final SecureRandom secureRandom = new SecureRandom();
    private final EmailSenderService emailSenderService;
    private final WebConfig webConfig;
    private final AuditLogsService auditLogsService;
    private final UserService userService;
    private final ObjectMapper objectMapper;

    public ActionTokensService(EmailSenderService emailSenderService, ActionTokensRepository actionTokensRepository, WebConfig webConfig, AuditLogsService auditLogsService, UserService userService, ObjectMapper objectMapper) {
        this.emailSenderService = emailSenderService;
        this.actionTokensRepository = actionTokensRepository;
        this.webConfig = webConfig;
        this.auditLogsService = auditLogsService;
        this.userService = userService;
        this.objectMapper = objectMapper;
    }

    public String getMetadataJsonFromMap(Map<String, Object> metadataMap) {
        String jsonMetadata = null;

        if (metadataMap != null && !metadataMap.isEmpty()) {
            try {
                jsonMetadata = objectMapper.writeValueAsString(metadataMap);
            } catch (Exception e) {
                log.error("Failed to serialize action token metadata");
                jsonMetadata = "{\"error\": \"Serialization failed\"}";
                return jsonMetadata;
            }
        }
        return jsonMetadata;
    }

    @Transactional
    public void actionRequest(User user, TokenType tokenType, Map<String, Object> metadataMap) {
        byte[] tokenBytes = new byte[32];
        secureRandom.nextBytes(tokenBytes);
        String token = Base64.getUrlEncoder().encodeToString(tokenBytes);

        ActionToken actionToken = new ActionToken();
        actionToken.setTokenHash(HashManager.hashText(token));
        actionToken.setExpiresAt(tokenType == TokenType.RESET_PASSWORD ? LocalDateTime.now().plusMinutes(15) : LocalDateTime.now().plusMinutes(30));

        if(!metadataMap.isEmpty()) {
            String metaData = getMetadataJsonFromMap(metadataMap);
            if(metaData.equalsIgnoreCase("{\"error\": \"Serialization failed\"}")) throw new SerializationFailedException("Neplatný převod metadata.");
            actionToken.setMetadata(metaData);
        }
        actionToken.setTokenType(tokenType);
        actionToken.setRequestor(user);
        actionTokensRepository.save(actionToken);

        switch (tokenType) {
            case VERIFY_EMAIL:
                emailSenderService.sendVerifyEmail(user, token, (String) metadataMap.get("newData"));
                auditLogsService.log(
                        LogType.CHANGE_EMAIL_REQUEST,
                        user.getId(),
                        UUID.randomUUID().toString(),
                        new HashMap<>()
                );
                break;
            case RESET_PASSWORD:
                emailSenderService.sendResetPasswordEmail(user, token);
                auditLogsService.log(
                        LogType.RESET_PASSWORD_REQUEST,
                        user.getId(),
                        UUID.randomUUID().toString(),
                        new HashMap<>()
                );
                break;
        }
    }

    @Transactional
    public void useToken(ActionToken actionToken) {
        if(actionToken == null || actionToken.getExpiresAt().isBefore(LocalDateTime.now())) throw new BadRequestException("Neplatný token!");
        if(actionToken.isUsed()) throw new ConflictException("Token byl již použit!");

        actionToken.setUsed(true);

        User user = actionToken.getRequestor();
        actionTokensRepository.findActionTokensByRequestor(user).forEach(actionToken1 -> {
            if(!actionToken1.equals(actionToken)) actionTokensRepository.delete(actionToken1);
        });


        Map<String, String> metadata = objectMapper.readValue(
                actionToken.getMetadata(),
                new TypeReference<>() {
                }
        );
        String newData = metadata.get("newData");
        switch (actionToken.getTokenType()) {
            case RESET_PASSWORD -> user.setNewPassword(newData, auditLogsService, webConfig);
            case VERIFY_EMAIL -> user.setEmail(newData, auditLogsService);
        }
        userService.save(user);
    }


    @Scheduled(fixedDelay = 3_600_000)
    @Transactional
    public void cleanupExpiredTokens() {
        actionTokensRepository.deleteExpired(LocalDateTime.now());
    }

    public Optional<ActionToken> getActionTokenByTokenHash(String tokenHash) {
        return actionTokensRepository.findActionTokenByTokenHash(tokenHash);
    }
}
