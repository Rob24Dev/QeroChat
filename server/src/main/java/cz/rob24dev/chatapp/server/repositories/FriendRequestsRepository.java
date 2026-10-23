package cz.rob24dev.chatapp.server.repositories;

import cz.rob24dev.chatapp.server.models.User;
import cz.rob24dev.chatapp.server.models.friends.FriendRequest;
import cz.rob24dev.chatapp.server.models.friends.FriendRequestState;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FriendRequestsRepository extends JpaRepository<FriendRequest, Long> {

    Optional<FriendRequest> findBySenderAndReceiver(User sender, User receiver);

    Optional<FriendRequest> findFriendRequestById(Long id);
    Optional<FriendRequest> findByReceiverAndId(User receiver, Long id);
    Optional<FriendRequest> findBySenderAndId(User sender, Long id);
    List<FriendRequest> findByReceiverIdAndState(UUID receiverId, FriendRequestState state);

    List<FriendRequest> findBySenderIdAndState(UUID senderId, FriendRequestState state);
}
