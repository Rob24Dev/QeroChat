package cz.rob24dev.chatapp.server.services;

import cz.rob24dev.chatapp.server.dto.ContactDto;
import cz.rob24dev.chatapp.server.exceptions.BadRequestException;
import cz.rob24dev.chatapp.server.exceptions.ConflictException;
import cz.rob24dev.chatapp.server.exceptions.ResourceNotFoundException;
import cz.rob24dev.chatapp.server.exceptions.UnauthorizedToOperateException;
import cz.rob24dev.chatapp.server.models.User;
import cz.rob24dev.chatapp.server.models.conversation.Chat;
import cz.rob24dev.chatapp.server.models.conversation.Contact;
import cz.rob24dev.chatapp.server.repositories.ContactRepository;
import jakarta.transaction.Transactional;
import jakarta.validation.constraints.NotBlank;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ContactService {

    private final ContactRepository contactRepository;

    public ContactService(ContactRepository contactRepository) {
        this.contactRepository = contactRepository;
    }


    @Transactional
    public Chat createNewContactsAfterAcceptedFr(User sender, User receiver) {
        Contact senderContact = new Contact();
        senderContact.setHolder(sender);
        senderContact.setContactUser(receiver);
        Contact receiverContact = new Contact();
        receiverContact.setHolder(receiver);
        receiverContact.setContactUser(sender);

        Chat generalChat = new Chat();
        generalChat.setActors(List.of(sender, receiver));
        generalChat.setName("Obecný");
        generalChat.setGlobal(true);
        senderContact.getContactChats().add(generalChat);
        receiverContact.getContactChats().add(generalChat);

        contactRepository.save(senderContact);
        contactRepository.save(receiverContact);
        return generalChat;
    }

    public Contact getContactByHolderAndContactUser(User holder, User contactUser) {
        return contactRepository.findContactByHolderAndContactUser(holder, contactUser).orElseThrow(() -> new ResourceNotFoundException("Contact nenalezen."));
    }


    public Optional<Contact> getOptionalContactByHolderAndContactUser(User holder, User contactUser) {
        return contactRepository.findContactByHolderAndContactUser(holder, contactUser);
    }


    public Contact getContactById(@NotBlank UUID contactId) {
        return contactRepository.findContactById(contactId).orElseThrow(() -> new ResourceNotFoundException("Contact nenalezen."));
    }

    public Contact getContactByHolderAndContactChatsContains(User holder, Chat chat) {
        return contactRepository.findContactByHolderAndContactChatsContains(holder, chat).orElseThrow(() -> new ResourceNotFoundException("Contact nenalezen."));
    }


    public void save(Contact contact) {
        contactRepository.save(contact);
    }


    @Transactional
    public List<ContactDto> getUserContactsDto(User user) {
        return contactRepository.findContactsByHolderId(user.getId()).stream()
                .map(ContactDto::from).toList();
    }

    public void blockContact(Contact blockContact, User requestor) {
        if(!blockContact.getHolder().getId().equals(requestor.getId())) throw new UnauthorizedToOperateException("Nemáš oprávnění manipulovat s tímto kontaktem.");
        Contact recieverContact = getContactByHolderAndContactUser(blockContact.getContactUser(), blockContact.getHolder());
        if(recieverContact.getId().equals(blockContact.getId())) throw new BadRequestException("Nemůžeš zablokovat sám sebe.");
        if(recieverContact.isBlockedMe() && blockContact.isBlocked()) throw new ConflictException("Contact je již zablokován");
        recieverContact.setBlockedMe(true);
        blockContact.setBlocked(true);

        contactRepository.save(recieverContact);
        contactRepository.save(blockContact);
    }

    public void unblockContact(Contact unblockContact, User requestor) {
        if(!unblockContact.getHolder().getId().equals(requestor.getId())) throw new UnauthorizedToOperateException("Nemáš oprávnění manipulovat s tímto kontaktem.");
        Contact recieverContact = getContactByHolderAndContactUser(unblockContact.getContactUser(), unblockContact.getHolder());
        if(recieverContact.getId().equals(unblockContact.getId())) throw new BadRequestException("Nemůžeš odblokovat sám sebe.");
        if(!recieverContact.isBlockedMe() && !unblockContact.isBlocked()) throw new ConflictException("Contact je již odblokován");
        recieverContact.setBlockedMe(false);
        unblockContact.setBlocked(false);

        contactRepository.save(recieverContact);
        contactRepository.save(unblockContact);
    }

    public void removeContact(Contact removeContact, Contact recieverContact, User requestor) {
        if(!removeContact.getHolder().getId().equals(requestor.getId())) throw new UnauthorizedToOperateException("Nemáš oprávněndí mdfgfdanipulovat s tímto kontaktem.");
        if(recieverContact.getId().equals(removeContact.getId())) throw new BadRequestException("Nemůžeš odstranit sám sebe.");
        if(recieverContact.isRemovedMe()) throw new ConflictException("Contact je již odstraněn.");
        recieverContact.setRemovedMe(true);
        removeContact.setRemoved(true);
        contactRepository.save(recieverContact);
        contactRepository.save(removeContact);
    }

}
