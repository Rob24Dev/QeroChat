package cz.rob24dev.chatapp.server.repositories;

import cz.rob24dev.chatapp.server.models.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findUserByEmail(String email);
    Optional<User> findUserById(UUID id);
}
