package cz.rob24dev.chatapp.server.repositories;

import cz.rob24dev.chatapp.server.models.User;
import cz.rob24dev.chatapp.server.models.conversation.Chat;
import cz.rob24dev.chatapp.server.models.conversation.Contact;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ContactRepository extends JpaRepository<Contact, UUID> {

    Optional<Contact> findContactByHolderAndContactUser(User holder, User contactUser);
    Optional<Contact> findContactById(UUID id);
    List<Contact> findContactsByHolderId(UUID holderId);
    Optional<Contact> findContactByHolderAndContactChatsContains(User holder, Chat chat);
}
