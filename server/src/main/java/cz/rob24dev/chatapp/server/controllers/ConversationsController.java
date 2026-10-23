package cz.rob24dev.chatapp.server.controllers;

import cz.rob24dev.chatapp.server.dto.requests.SendOrEditMessageRequest;
import cz.rob24dev.chatapp.server.models.User;
import cz.rob24dev.chatapp.server.models.conversation.Message;
import cz.rob24dev.chatapp.server.services.ChatService;
import cz.rob24dev.chatapp.server.services.MessagesService;
import cz.rob24dev.chatapp.server.services.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/v1/conversations")
public class ConversationsController {

    private final ChatService chatService;
    private final UserService userService;
    private final MessagesService messagesService;
    public ConversationsController(ChatService chatService, UserService userService, MessagesService messagesService) {
        this.chatService = chatService;
        this.userService = userService;
        this.messagesService = messagesService;
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<?> getMessages(@Valid @PathVariable("id") UUID chatId,
                                         @Valid @RequestParam int limit, LocalDateTime before, @RequestAttribute("authenticatedUserId") UUID userId) {
        User user = userService.getUserById(userId);
        return ResponseEntity.ok(chatService.getMessages(user, chatId, limit, before));
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<?> sendMessage(@PathVariable("id") UUID chatId,
                                         @Valid @RequestBody SendOrEditMessageRequest sendOrEditMessageRequest, @RequestAttribute("authenticatedUserId") UUID userId) {
        User user = userService.getUserById(userId);
        return ResponseEntity.ok().body(chatService.sendMessage(chatId, user, sendOrEditMessageRequest.getText()));
    }

    @PatchMapping("{id}/messages/{msgId}")
    public ResponseEntity<?> editMessage(@PathVariable("id") UUID chatId, @PathVariable UUID msgId,
                                         @Valid @RequestBody SendOrEditMessageRequest sendOrEditMessageRequest, @RequestAttribute("authenticatedUserId") UUID userId) {
        User user = userService.getUserById(userId);
        Message message = messagesService.getMessageById(msgId);
        return ResponseEntity.ok().body(chatService.editMessage(chatId, user, message, sendOrEditMessageRequest));
    }

    @DeleteMapping("{id}/messages/{msgId}")
    public ResponseEntity<?> deleteMessage(@PathVariable("id") UUID chatId, @
            PathVariable UUID msgId, @RequestAttribute("authenticatedUserId") UUID userId) {
        User user = userService.getUserById(userId);
        Message message = messagesService.getMessageById(msgId);
        chatService.deleteMessage(chatId, user, message);
        return ResponseEntity.ok().build();
    }
}
