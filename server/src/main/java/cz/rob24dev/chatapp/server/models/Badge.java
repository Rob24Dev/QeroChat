package cz.rob24dev.chatapp.server.models;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "badges")
public class Badge {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true)
    private String icon;
    @Column(unique = true)
    private String title;
}
