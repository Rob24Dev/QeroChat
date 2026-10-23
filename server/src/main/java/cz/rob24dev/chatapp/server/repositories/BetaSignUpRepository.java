package cz.rob24dev.chatapp.server.repositories;

import cz.rob24dev.chatapp.server.models.BetaSignUp;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BetaSignUpRepository extends JpaRepository<BetaSignUp, UUID> {
    Optional<BetaSignUp> findByEmail(String email);
}
