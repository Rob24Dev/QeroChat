package cz.rob24dev.chatapp.server.services;

import cz.rob24dev.chatapp.server.exceptions.ResourceNotFoundException;
import cz.rob24dev.chatapp.server.models.conversation.Chat;
import cz.rob24dev.chatapp.server.models.conversation.Message;
import cz.rob24dev.chatapp.server.repositories.MessagesRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class MessagesService {

    private final MessagesRepository messagesRepository;

    public MessagesService(MessagesRepository messagesRepository) {
        this.messagesRepository = messagesRepository;
    }

    public List<Message> getMessagesByChatAndCreatedAtBefore(Chat chat, LocalDateTime before, Pageable pageable) {
        return messagesRepository.findByChatAndCreatedAtBeforeOrderByCreatedAtDesc(chat, before, pageable);
    }

    public List<Message> getMessagesByChat(Chat chat, Pageable pageable) {
        return messagesRepository.findByChatOrderByCreatedAtDesc(chat, pageable);
    }

    public Message getMessageById(UUID msgId) {
        return messagesRepository.findMessageById(msgId).orElseThrow(() -> new ResourceNotFoundException("Zpráva nebyla nalezena."));
    }

    public void save(Message message) {
        messagesRepository.save(message);
    }

    public void delete(Message message) {
        messagesRepository.delete(message);
    }
}
