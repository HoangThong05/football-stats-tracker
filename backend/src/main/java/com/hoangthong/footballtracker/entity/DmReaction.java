package com.hoangthong.footballtracker.entity;

import jakarta.persistence.*;

import java.time.Instant;

/**
 * Cam xuc cua mot nguoi len mot tin nhan rieng. Moi nguoi mot cam xuc/tin (unique).
 * Dung chung enum ReactionType voi dien dan.
 */
@Entity
@Table(name = "dm_reaction",
        uniqueConstraints = @UniqueConstraint(columnNames = {"message_id", "user_id"}))
public class DmReaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "message_id")
    private DirectMessage message;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private ReactionType type;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected DmReaction() {
        // JPA can
    }

    public DmReaction(DirectMessage message, User user, ReactionType type) {
        this.message = message;
        this.user = user;
        this.type = type;
    }

    public Long getId() { return id; }
    public DirectMessage getMessage() { return message; }
    public User getUser() { return user; }
    public ReactionType getType() { return type; }
    public void setType(ReactionType type) { this.type = type; }
}
