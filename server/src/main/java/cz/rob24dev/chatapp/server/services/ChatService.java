package cz.rob24dev.chatapp.server.services;

import cz.rob24dev.chatapp.server.dto.ChatDto;
import cz.rob24dev.chatapp.server.dto.MessageDto;
import cz.rob24dev.chatapp.server.dto.requests.CreateChatRequest;
import cz.rob24dev.chatapp.server.dto.requests.EditChatRequest;
import cz.rob24dev.chatapp.server.dto.requests.SendOrEditMessageRequest;
import cz.rob24dev.chatapp.server.exceptions.BadRequestException;
import cz.rob24dev.chatapp.server.exceptions.ResourceNotFoundException;
import cz.rob24dev.chatapp.server.exceptions.UnauthorizedToOperateException;
import cz.rob24dev.chatapp.server.models.User;
import cz.rob24dev.chatapp.server.models.conversation.Chat;
import cz.rob24dev.chatapp.server.models.conversation.Contact;
import cz.rob24dev.chatapp.server.models.conversation.Message;
import cz.rob24dev.chatapp.server.repositories.ChatsRepository;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class ChatService {


    private final UserService userService;
    private final ContactService contactService;
    private final ChatsRepository chatsRepository;
    private final MessagesService messagesService;

    public ChatService(UserService userService, ContactService contactService, ChatsRepository chatsRepository, MessagesService messagesService) {
        this.userService = userService;
        this.contactService = contactService;
        this.chatsRepository = chatsRepository;
        this.messagesService = messagesService;
    }

    @Transactional
    public void createNewChatWithContact(UUID requestorId, CreateChatRequest createChatRequest) {
        User requestor = userService.getUserById(requestorId);
        Contact contact = contactService.getContactById(createChatRequest.getContactId());
        if(!contact.getHolder().getId().equals(requestor.getId())) throw new UnauthorizedToOperateException("Nemáš povolení přidávat chat do tohohle kontaktu.");
        if(contact.isBlockedMe() || contact.isBlocked() || contact.isRemovedMe() || contact.isRemoved()) throw new BadRequestException("S tímto kontaktem nemůžeš tvořit nové chaty.");
        Chat chat = new Chat();
        chat.setName(createChatRequest.getName());
        chat.setIconUrl(createChatRequest.getIcon());
        chat.setActors(List.of(requestor, contact.getContactUser()));
        chatsRepository.save(chat);

        contact.getContactChats().add(chat);

        Contact reverseContact = contactService.getContactByHolderAndContactUser(contact.getContactUser(), requestor);

        reverseContact.getContactChats().add(chat);

        contactService.save(contact);
        contactService.save(reverseContact);
    }

    @Transactional
    public void editChat(@Valid EditChatRequest editChatRequest, UUID chatId, UUID requestorId) {
        User requestor = userService.getUserById(requestorId);
        Chat chat = chatsRepository.findChatByActorsContainsAndId(requestor, chatId).orElse(null);
        Contact contact = contactService.getContactByHolderAndContactChatsContains(requestor, chat);
        if(chat == null) throw new ResourceNotFoundException("Chat nebyl nalezen.");
        if(chat.isGlobal()) throw new BadRequestException("Global chat nejde upravit.");
        if(!chat.getId().equals(chatId)) throw new UnauthorizedToOperateException("Nemáš povolení upravovat tento chat.");
        if(contact.isBlockedMe() || contact.isBlocked() || contact.isRemovedMe() || contact.isRemoved()) throw new BadRequestException("S tímto kontaktem nemůžeš upravovat chaty.");
        chat.setName(editChatRequest.getName());
        chat.setIconUrl(editChatRequest.getIcon());
        chatsRepository.save(chat);
    }

    @Transactional
    public void deleteChat(UUID chatId, UUID requestorId) {
        User requestor = userService.getUserById(requestorId);
        Optional<Chat> optionalChat = getChatByActorsContainsAndId(requestor, chatId);
        if(optionalChat.isEmpty() || !optionalChat.get().getId().equals(chatId)) throw new UnauthorizedToOperateException("Nemáš povolení mazat tento chat.");
        Chat chat = optionalChat.get();
        if(chat.isGlobal()) throw new BadRequestException("Global chat nejde odstranit.");
        Contact contact = contactService.getContactByHolderAndContactChatsContains(requestor, chat);
        if(contact.isBlockedMe() || contact.isBlocked() || contact.isRemovedMe() || contact.isRemoved()) throw new BadRequestException("S tímto kontaktem nemůžeš mazat chaty.");
        Contact reverseContact = contactService.getContactByHolderAndContactUser(contact.getContactUser(), requestor);
        contact.getContactChats().remove(chat);
        reverseContact.getContactChats().remove(chat);
        contactService.save(contact);
        contactService.save(reverseContact);

        chatsRepository.delete(chat);
    }

    @Transactional
    public void save(Chat chat) {
        chatsRepository.save(chat);
    }



    public Optional<Chat> getChatByActorsContainsAndId(User requestor, UUID chatId) {
        return chatsRepository.findChatByActorsContainsAndId(requestor, chatId);
    }

    @Transactional
    public List<MessageDto> getMessages(User requestor, UUID chatId, int limit, LocalDateTime before) {
        Optional<Chat> optionalChat = getChatByActorsContainsAndId(requestor, chatId);
        if(optionalChat.isEmpty() || optionalChat.get().getActors().contains(requestor)) throw new UnauthorizedToOperateException("Nemáš oprávnění nahlížet na tento chat.");
        Chat chat = optionalChat.get();
        List<Message> messages;
        Pageable messagesPageable = PageRequest.of(0, limit);
        if(before == null) messages = messagesService.getMessagesByChat(chat, messagesPageable);
        else messages = messagesService.getMessagesByChatAndCreatedAtBefore(chat, before, messagesPageable);
        Collections.reverse(messages);
        return messages.stream()
                .map(MessageDto::from)
                .toList();
    }

    @Transactional
    public MessageDto sendMessage(UUID chatId, User author, @NotBlank String text) {
        Optional<Chat> optionalChat = getChatByActorsContainsAndId(author, chatId);
        if(optionalChat.isEmpty() || optionalChat.get().getActors().contains(author)) throw new UnauthorizedToOperateException("Nemáš oprávnění posílat zprávy do tohohle chatu.");
        Chat chat = optionalChat.get();
        Contact contact = contactService.getContactByHolderAndContactChatsContains(author, chat);
        if(contact.isBlockedMe() || contact.isBlocked() || contact.isRemovedMe() || contact.isRemoved()) throw new BadRequestException("Tomuhle uživateli nemůžeš poslat zprávu.");
        Message message = new Message();
        message.setChat(chat);
        message.setText(text);
        message.setAuthor(author);
        messagesService.save(message);
        return MessageDto.from(message);
    }


    @Transactional
    public List<ChatDto> getUserChatsDto(UUID userId) {
        User user = userService.getUserById(userId);
        return chatsRepository.findChatsOfUserWithActors(user.getId()).stream()
                .map(chat -> ChatDto.from(chat, user))
                .toList();
    }

    @Transactional
    public MessageDto editMessage(UUID messageChatId, User requestor, Message message, SendOrEditMessageRequest sendOrEditMessageRequest) {
        Contact contact = contactService.getContactByHolderAndContactChatsContains(message.getAuthor(), message.getChat());
        Optional<Chat> optionalChat = getChatByActorsContainsAndId(requestor, messageChatId);
        if(optionalChat.isEmpty() || optionalChat.get().getId().equals(messageChatId)) throw new UnauthorizedToOperateException("Nemáš povolení upravovat zprávy v tomto chatu.");
        if(!message.getAuthor().getId().equals(requestor.getId())) throw new UnauthorizedToOperateException("Nemůžeš upravovat zprávu, která není tvoje.");
        if(contact.isBlockedMe() || contact.isBlocked() || contact.isRemovedMe() || contact.isRemoved()) throw new BadRequestException("V tomto chatu nemůžeš upravovat zprávu.");
        if(message.getText().equals(sendOrEditMessageRequest.getText())) throw new BadRequestException("Zprávu si neupravil.");
        message.setEdited(true);
        message.setText(sendOrEditMessageRequest.getText());
        messagesService.save(message);
        return MessageDto.from(message);
    }

    @Transactional
    public void deleteMessage(UUID messageChatId, User requestor, Message message) {
        Optional<Chat> optionalChat = getChatByActorsContainsAndId(requestor, messageChatId);
        if(optionalChat.isEmpty() || optionalChat.get().getId().equals(messageChatId)) throw new UnauthorizedToOperateException("Nemáš povolení odstranovat zprávy v tomto chatu.");
        if(!message.getAuthor().getId().equals(requestor.getId())) throw new UnauthorizedToOperateException("Nemůžeš smazat zprávu, která není tvoje.");
        Contact contact = contactService.getContactByHolderAndContactChatsContains(message.getAuthor(), message.getChat());
        if(contact.isBlockedMe() || contact.isBlocked() || contact.isRemovedMe() || contact.isRemoved()) throw new BadRequestException("V tomto chatu nemůžeš smazat zprávu.");
        messagesService.delete(message);
    }
}
