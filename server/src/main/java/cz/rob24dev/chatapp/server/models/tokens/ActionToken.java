package cz.rob24dev.chatapp.server.models.tokens;

import com.fasterxml.jackson.annotation.JsonBackReference;
import cz.rob24dev.chatapp.server.models.User;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "actions_tokens")
public class ActionToken {
    @Id
    public String tokenHash;
    public LocalDateTime expiresAt;
    @Enumerated(EnumType.STRING)
    private TokenType tokenType;
    public boolean used;
    @ManyToOne
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JsonBackReference
    @JoinColumn(name = "requestor_id")
    private User requestor;
    @Column(columnDefinition = "TEXT")
    private String metadata;
}
