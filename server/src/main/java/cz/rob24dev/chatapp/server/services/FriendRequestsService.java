package cz.rob24dev.chatapp.server.services;

import cz.rob24dev.chatapp.server.dto.FriendRequestDto;
import cz.rob24dev.chatapp.server.exceptions.ConflictException;
import cz.rob24dev.chatapp.server.exceptions.ResourceNotFoundException;
import cz.rob24dev.chatapp.server.exceptions.UnauthorizedToOperateException;
import cz.rob24dev.chatapp.server.models.User;
import cz.rob24dev.chatapp.server.models.conversation.Contact;
import cz.rob24dev.chatapp.server.models.friends.FriendRequest;
import cz.rob24dev.chatapp.server.models.friends.FriendRequestState;
import cz.rob24dev.chatapp.server.repositories.FriendRequestsRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class FriendRequestsService {

    private final FriendRequestsRepository friendRequestsRepository;
    private final ChatService chatService;
    private final ContactService contactService;

    public FriendRequestsService(FriendRequestsRepository friendRequestsRepository, ContactService contactService, ChatService chatService) {
        this.friendRequestsRepository = friendRequestsRepository;
        this.contactService = contactService;
        this.chatService = chatService;
    }

    @Transactional
    public FriendRequestDto createNewRequest(User sender, User receiver) {
        Optional<Contact> optionalContact = contactService.getOptionalContactByHolderAndContactUser(sender, receiver);
        Contact contact;
        if(sender.getId().equals(receiver.getId())) throw new ConflictException("Nemůžeš poslat friend request sám sobě.");
        if(optionalContact.isPresent()) {
            contact = optionalContact.get();
            if(!contact.isBlockedMe() && !contact.isBlocked() && !contact.isRemovedMe() && !contact.isRemoved()) throw new ConflictException("Už jste přátelé.");
            if(contact.isBlocked() || contact.isBlockedMe()) throw new UnauthorizedToOperateException("Tomuhle uživateli nemůžeš poslat žádost o přátelství.");
        }
        if(getFriendRequestBySenderAndReceiver(sender, receiver).isPresent() ||
                getFriendRequestBySenderAndReceiver(receiver, sender).isPresent()) throw new ConflictException("Tuhle žádost o přátelství si již poslal, nebo ti byla poslána.");

        FriendRequest friendRequest = new FriendRequest();
        friendRequest.setReceiver(receiver);
        friendRequest.setSender(sender);
        friendRequest.setState(FriendRequestState.PENDING);
        friendRequestsRepository.save(friendRequest);
        return FriendRequestDto.from(friendRequest, false);
    }

    @Transactional
    public void respondToFriendRequest(FriendRequest friendRequest, User requestor, boolean accepted) {
        if(friendRequestsRepository.findByReceiverAndId(requestor, friendRequest.getId()).isEmpty()) throw new UnauthorizedToOperateException("Nemáš oprávnění operovat s touto žádostí o přátelství.");
        if(friendRequest.getState() != FriendRequestState.PENDING) throw new ConflictException("Na tuto žádost již bylo zodpovězeno.");
        friendRequest.setState(accepted ? FriendRequestState.ACCEPTED : FriendRequestState.DECLINED);
        if(accepted) {
            Optional<Contact> contact = contactService.getOptionalContactByHolderAndContactUser(friendRequest.getSender(), friendRequest.getReceiver());
            Optional<Contact> reverseContact = contactService.getOptionalContactByHolderAndContactUser(friendRequest.getReceiver(), friendRequest.getSender());
            if(contact.isPresent() && reverseContact.isPresent()) {
                if(contact.get().isRemoved()) contact.get().setRemoved(false);
                if(contact.get().isRemovedMe()) contact.get().setRemovedMe(false);
                if(reverseContact.get().isRemoved()) reverseContact.get().setRemoved(false);
                if(reverseContact.get().isRemovedMe()) reverseContact.get().setRemovedMe(false);
            } else chatService.save(contactService.createNewContactsAfterAcceptedFr(friendRequest.getSender(), friendRequest.getReceiver()));
        }
        friendRequestsRepository.save(friendRequest);
    }

    public void deleteRequestAfterRemoveContact(User sender, Contact recieverContact) {
        Optional<FriendRequest> friendRequest = getFriendRequestBySenderAndReceiver(sender, recieverContact.getHolder());
        if(friendRequest.isEmpty()) friendRequest = getFriendRequestBySenderAndReceiver(recieverContact.getHolder(), sender);
        friendRequest.ifPresent(request -> deleteRequest(request, sender));
    }

    public void deleteRequest(FriendRequest friendRequest, User requestor) {
        if(friendRequestsRepository.findBySenderAndId(requestor, friendRequest.getId()).isEmpty()
                && friendRequestsRepository.findByReceiverAndId(requestor, friendRequest.getId()).isEmpty()) throw new ConflictException("Nemáš oprávnění operovat s touto žádostí o přátelství.");
        friendRequestsRepository.delete(friendRequest);
    }



    public Optional<FriendRequest> getFriendRequestBySenderAndReceiver(User sender, User receiver) {
        return friendRequestsRepository.findBySenderAndReceiver(sender, receiver);
    }

    public FriendRequest getFriendRequestById(Long requestId) {
        return friendRequestsRepository.findFriendRequestById(requestId).orElseThrow(() -> new ResourceNotFoundException("Tato žádost o přátelství neexistuje."));
    }

    @Transactional
    public List<FriendRequestDto> getUserIncomingFriendsRequests(User user) {
        return friendRequestsRepository.findByReceiverIdAndState(user.getId(), FriendRequestState.PENDING).stream()
                .map(fr -> FriendRequestDto.from(fr, true))
                .toList();
    }

    @Transactional
    public List<FriendRequestDto> getUserOutgoingFriendsRequests(User user) {
        return friendRequestsRepository.findBySenderIdAndState(user.getId(), FriendRequestState.PENDING).stream()
                .map(fr -> FriendRequestDto.from(fr, false))
                .toList();
    }

}
