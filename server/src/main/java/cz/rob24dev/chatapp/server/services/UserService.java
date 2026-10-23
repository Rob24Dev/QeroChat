package cz.rob24dev.chatapp.server.services;

import cz.rob24dev.chatapp.server.exceptions.ResourceNotFoundException;
import cz.rob24dev.chatapp.server.models.User;
import cz.rob24dev.chatapp.server.repositories.UserRepository;
import org.springframework.stereotype.Service;
import java.util.Optional;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public Optional<User> getUserByEmail(String email) {
        return userRepository.findUserByEmail(email);
    }

    public User getUserById(UUID id) {
        return userRepository.findUserById(id).orElseThrow(() -> new ResourceNotFoundException("Uživatel nebyl nalezen."));
    }

    public User save(User user) {
        return userRepository.save(user);
    }

    public void deleteUser() {

    }
}

