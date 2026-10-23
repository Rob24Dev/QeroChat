package cz.rob24dev.chatapp.server.controllers;

import cz.rob24dev.chatapp.server.dto.requests.FriendRequestRespond;
import cz.rob24dev.chatapp.server.dto.requests.NewFriendRequest;
import cz.rob24dev.chatapp.server.exceptions.ResourceNotFoundException;
import cz.rob24dev.chatapp.server.models.User;
import cz.rob24dev.chatapp.server.models.conversation.Contact;
import cz.rob24dev.chatapp.server.models.friends.FriendRequest;
import cz.rob24dev.chatapp.server.services.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1/friends")
public class FriendsController {

    private final UserService userService;
    private final FriendRequestsService friendRequestsService;
    private final ContactService contactService;

    public FriendsController(UserService userService, FriendRequestsService friendRequestsService, ContactService contactService) {
        this.userService = userService;
        this.friendRequestsService = friendRequestsService;
        this.contactService = contactService;
    }

    @GetMapping("")
    public ResponseEntity<?> getFriends(@RequestAttribute("authenticatedUserId") UUID userId) {
        User user = userService.getUserById(userId);
        return ResponseEntity.status(HttpStatus.OK).body(contactService.getUserContactsDto(user));
    }

    @DeleteMapping("{id}")
    public ResponseEntity<?> deleteContact(@PathVariable("id") UUID contactId, @RequestAttribute("authenticatedUserId") UUID userId) {
        User user = userService.getUserById(userId);
        Contact contact = contactService.getContactById(contactId);
        Contact recieverContact = contactService.getContactByHolderAndContactUser(contact.getContactUser(), contact.getHolder());
        contactService.removeContact(contact, recieverContact, user);
        friendRequestsService.deleteRequestAfterRemoveContact(user, recieverContact);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/requests")
    public ResponseEntity<?> getFriendsRequests(@RequestAttribute("authenticatedUserId") UUID userId) {
        User user = userService.getUserById(userId);
        return ResponseEntity.status(HttpStatus.OK).body(Map.of(
                "incoming", friendRequestsService.getUserIncomingFriendsRequests(user),
                "outgoing", friendRequestsService.getUserOutgoingFriendsRequests(user)));
    }

    @PostMapping("/requests")
    public ResponseEntity<?> createNewRequest(@Valid @RequestBody NewFriendRequest newFriendRequest, @RequestAttribute("authenticatedUserId") UUID userId) {
        User sender = userService.getUserById(userId);
        User receiver = userService.getUserByEmail(newFriendRequest.getEmail()).orElseThrow(() -> new ResourceNotFoundException("Uživatel, kterému chceš poslat žádost o přátelství neexistuje."));
        return ResponseEntity.ok().body(friendRequestsService.createNewRequest(sender, receiver));
    }

    @PostMapping("/requests/{id}/respond")
    public ResponseEntity<?> respondRequest(@PathVariable("id") Long requestId, @RequestBody FriendRequestRespond friendRequestRespond, @RequestAttribute("authenticatedUserId") UUID userId) {
        User user = userService.getUserById(userId);
        FriendRequest friendRequest = friendRequestsService.getFriendRequestById(requestId);
        friendRequestsService.respondToFriendRequest(friendRequest, user, friendRequestRespond.isAccept());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/requests/{id}")
    public ResponseEntity<?> deleteRequest(@PathVariable("id") Long requestId, @RequestAttribute("authenticatedUserId") UUID userId) {
        User user = userService.getUserById(userId);
        FriendRequest friendRequest = friendRequestsService.getFriendRequestById(requestId);
        friendRequestsService.deleteRequest(friendRequest, user);
        return ResponseEntity.ok().build();
    }
}

