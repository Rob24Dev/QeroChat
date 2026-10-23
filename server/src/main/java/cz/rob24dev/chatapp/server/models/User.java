package cz.rob24dev.chatapp.server.models;


import com.fasterxml.jackson.annotation.JsonManagedReference;
import cz.rob24dev.chatapp.server.config.WebConfig;
import cz.rob24dev.chatapp.server.models.conversation.Contact;
import cz.rob24dev.chatapp.server.models.friends.FriendRequest;
import cz.rob24dev.chatapp.server.models.logs.LogType;
import cz.rob24dev.chatapp.server.services.AuditLogsService;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Data
@Table(name = "users")
public class User {
    @Id
    @UuidGenerator
    private UUID id;
    @Column(nullable = false)
    private String name;
    @Column(nullable = false, unique = true)
    private String email;
    @Column(columnDefinition = "TEXT")
    private String passwordHash;
    private String avatarUrl;
    private String bannerUrl;
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "users_badges",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "badge_id")
    )
    private List<Badge> userBadges = new ArrayList<>();
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime memberSince;
    @Enumerated(EnumType.STRING)
    private UserStates.UserState status;
    private String statusText;
    @OneToMany(mappedBy = "holder", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Contact> userContacts = new ArrayList<>();
    @OneToMany(mappedBy = "receiver", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("incoming")
    private List<FriendRequest> incomingRequests = new ArrayList<>();
    @OneToMany(mappedBy = "sender", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("outgoing")
    private List<FriendRequest> outgoingRequests = new ArrayList<>();
    private boolean sendNewsLetter;
    private boolean isDeleted;

    public void setEmail(String newEmail, AuditLogsService auditLogsService) {
        auditLogsService.log(
                LogType.CHANGE_EMAIL,
                id,
                UUID.randomUUID().toString(),
                Map.of(
                        "old_email", email,
                        "new_email", newEmail)
        );
        this.email = newEmail;
    }

    public void setNewPassword(String newPassword, AuditLogsService auditLogsService, WebConfig webConfig) {
        String newPassHash = webConfig.passwordEncoder().encode(newPassword);
        auditLogsService.log(
                LogType.CHANGE_PASSWORD,
                id,
                UUID.randomUUID().toString(),
                Map.of(
                        "old_password", passwordHash,
                        "new_password", newPassHash)
        );
        this.passwordHash = newPassHash;
    }
}
