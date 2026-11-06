/*
 *
 * Copyright (c) 2026 Robert Darvaš. All rights reserved.
 *
 * Part of the QeroChat project.
 * Written by Rob24Dev <https://github.com/Rob24Dev>
 *
 */

package cz.rob24dev.chatapp.server.models;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.hibernate.annotations.UuidGenerator;

import java.util.UUID;

@Entity
@Data
@Table(name = "beta_signs_up")
public class BetaSignUp {

    @Id
    @UuidGenerator
    private UUID id;
    @Column(nullable = false, unique = true)
    private String email;
    private boolean agreeNews;
    @ManyToOne
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JsonBackReference
    @JoinColumn(name = "beta_user_id")
    private User betaUser;
}
