package cz.rob24dev.chatapp.server.repositories;

import cz.rob24dev.chatapp.server.models.User;
import cz.rob24dev.chatapp.server.models.conversation.Chat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChatsRepository extends JpaRepository<Chat, UUID> {

    Optional<Chat> findChatByActorsContainsAndId(User user, UUID id);
    @Query("""
        select distinct ch
        from Contact c
        join c.contactChats ch
        left join fetch ch.actors
        where c.holder.id = :userId
    """)
    List<Chat> findChatsOfUserWithActors(@Param("userId") UUID userId);

}
