package cz.rob24dev.chatapp.server.services;

import cz.rob24dev.chatapp.server.models.User;
import cz.rob24dev.chatapp.server.models.logs.AuditLog;
import cz.rob24dev.chatapp.server.models.logs.LogType;
import cz.rob24dev.chatapp.server.repositories.AuditLogsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogsService {

    private final AuditLogsRepository auditLogsRepository;
    private final ObjectMapper objectMapper;
    private final UserService userService;

    @Transactional(propagation = Propagation.REQUIRED)
    public void log(LogType logType, UUID userId, String transactionId, Map<String, Object> metadataMap) {
        User user = null;
        if(userId != null) user = userService.getUserById(userId);
        String jsonMetadata = null;

        if (metadataMap != null && !metadataMap.isEmpty()) {
            try {
                jsonMetadata = objectMapper.writeValueAsString(metadataMap);
            } catch (Exception e) {
                log.error("Failed to serialize audit log metadata");
                jsonMetadata = "{\"error\": \"Serialization failed\"}";
            }
        }

        AuditLog auditLog = new AuditLog(logType, user, transactionId, jsonMetadata);
        auditLogsRepository.save(auditLog);
    }
}
