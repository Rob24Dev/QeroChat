package cz.rob24dev.chatapp.server.models.conversation;

import com.fasterxml.jackson.annotation.JsonBackReference;
import cz.rob24dev.chatapp.server.models.User;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Data
@Table(name = "user_contacts_chats_messages",
        indexes = @Index(columnList = "chat_id, created_at"))
public class Message {
    @Id
    @UuidGenerator
    private UUID id;
    @ManyToOne
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JsonBackReference
    @JoinColumn(name = "author_id")
    private User author;
    @ManyToOne(optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "chat_id")
    @JsonBackReference
    private Chat chat;
    @Column(columnDefinition = "TEXT")
    private String text;
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    private boolean isEdited;

}
