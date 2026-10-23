package cz.rob24dev.chatapp.server.models.conversation;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import cz.rob24dev.chatapp.server.models.User;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.UuidGenerator;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Data
@Table(name = "users_contacts_chats")
public class Chat {
    @Id
    @UuidGenerator
    private UUID id;
    @Column(nullable = false)
    private String name;
    @ManyToMany
    @JoinTable(
            name = "users_contacts_chats_actors",
            joinColumns = @JoinColumn(name = "chat_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private List<User> actors = new ArrayList<>();
    private boolean isGlobal;
    private String iconUrl;
    @OneToMany(mappedBy = "chat", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<Message> messages = new ArrayList<>();
    int unread;

}
