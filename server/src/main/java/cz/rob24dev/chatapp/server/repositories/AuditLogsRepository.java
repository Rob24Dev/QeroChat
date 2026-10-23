package cz.rob24dev.chatapp.server.repositories;

import cz.rob24dev.chatapp.server.models.logs.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogsRepository extends JpaRepository<AuditLog, Long> {
}
