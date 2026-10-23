package cz.rob24dev.chatapp.server.repositories;

import cz.rob24dev.chatapp.server.models.conversation.Chat;
import cz.rob24dev.chatapp.server.models.conversation.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MessagesRepository extends JpaRepository<Message, UUID> {

    List<Message> findByChatAndCreatedAtBeforeOrderByCreatedAtDesc(Chat chat, LocalDateTime createdAtBefore, Pageable pageable);

    List<Message> findByChatOrderByCreatedAtDesc(Chat chat, Pageable pageable);

    Optional<Message> findMessageById(UUID id);
}
