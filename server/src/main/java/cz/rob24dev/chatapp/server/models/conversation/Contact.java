package cz.rob24dev.chatapp.server.models.conversation;

import com.fasterxml.jackson.annotation.JsonBackReference;
import cz.rob24dev.chatapp.server.models.User;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.hibernate.annotations.UuidGenerator;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Data
@Table(name = "users_contacts")
public class Contact {
    @Id
    @UuidGenerator
    private UUID id;
    @ManyToOne
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JsonBackReference
    @JoinColumn(name = "holder_id")
    private User holder;
    @ManyToOne
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JsonBackReference
    @JoinColumn(name = "contact_user_id")
    private User contactUser;
    private boolean blocked;
    private boolean blockedMe;
    private boolean removed;
    private boolean removedMe;

    private int unread; //TODO: Add unread system
    @ManyToMany
    @JoinTable(
            name = "users_contacts_chats_link",
            joinColumns = @JoinColumn(name = "contact_id"),
            inverseJoinColumns = @JoinColumn(name = "chat_id")
    )
    private List<Chat> contactChats = new ArrayList<>();

}
