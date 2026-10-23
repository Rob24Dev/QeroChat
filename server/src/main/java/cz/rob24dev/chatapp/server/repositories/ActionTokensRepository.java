package cz.rob24dev.chatapp.server.repositories;

import cz.rob24dev.chatapp.server.models.tokens.ActionToken;
import cz.rob24dev.chatapp.server.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ActionTokensRepository extends JpaRepository<ActionToken, String> {

    Optional<ActionToken> findActionTokenByTokenHash(String tokenHash);
    List<ActionToken> findActionTokensByRequestor(User user);

    @Modifying
    @Query("DELETE FROM ActionToken t WHERE t.expiresAt < :before")
    void deleteExpired(@Param("before") LocalDateTime before);
}
