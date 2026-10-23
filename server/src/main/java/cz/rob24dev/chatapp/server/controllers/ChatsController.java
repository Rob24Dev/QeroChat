package cz.rob24dev.chatapp.server.controllers;

import cz.rob24dev.chatapp.server.dto.requests.CreateChatRequest;
import cz.rob24dev.chatapp.server.dto.requests.EditChatRequest;
import cz.rob24dev.chatapp.server.services.ChatService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/v1/chats")
public class ChatsController {

    private final ChatService chatService;

    public ChatsController(ChatService chatService) {
        this.chatService = chatService;
    }

    @GetMapping("")
    public ResponseEntity<?> getUserChats(@RequestAttribute("authenticatedUserId") UUID userId) {
        return ResponseEntity.status(HttpStatus.OK).body(chatService.getUserChatsDto(userId));
    }

    @PostMapping("")
    public ResponseEntity<?> createNewChat(@Valid @RequestBody CreateChatRequest createChatRequest, @RequestAttribute("authenticatedUserId") UUID userId) {
        chatService.createNewChatWithContact(userId, createChatRequest);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> editChat(@Valid @RequestBody EditChatRequest editChatRequest, @Valid @PathVariable("id") UUID chatId, @RequestAttribute("authenticatedUserId") UUID userId) {
        chatService.editChat(editChatRequest, chatId, userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteChat(@Valid @PathVariable("id") UUID chatId, @RequestAttribute("authenticatedUserId") UUID userId) {
        chatService.deleteChat(chatId, userId);
        return ResponseEntity.ok().build();
    }
}
