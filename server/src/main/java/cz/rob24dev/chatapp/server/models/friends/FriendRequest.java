package cz.rob24dev.chatapp.server.models.friends;

import com.fasterxml.jackson.annotation.JsonBackReference;
import cz.rob24dev.chatapp.server.models.User;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "friends_requests",
        uniqueConstraints = @UniqueConstraint(columnNames = { "sender_id", "receiver_id" }))
public class FriendRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Enumerated(EnumType.STRING)
    private FriendRequestState state;
    @ManyToOne
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JsonBackReference("outgoing")
    @JoinColumn(name = "sender_id")
    private User sender;
    @ManyToOne
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JsonBackReference("incoming")
    @JoinColumn(name = "receiver_id")
    private User receiver;
    @CreationTimestamp
    private LocalDateTime createdAt;
}

