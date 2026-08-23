package com.hoangthong.footballtracker.entity;

import jakarta.persistence.*;

import java.time.Instant;

/**
 * Mot cam xuc tren BINH LUAN. Rang buoc duy nhat (comment, user): moi nguoi mot cam xuc
 * cho moi binh luan (doi loai thi sua dong san co, khong tao them).
 */
@Entity
@Table(name = "comment_reaction",
        uniqueConstraints = @UniqueConstraint(columnNames = {"comment_id", "user_id"}))
public class CommentReaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "comment_id")
    private ForumComment comment;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private ReactionType type;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected CommentReaction() {
        // JPA can
    }

    public CommentReaction(ForumComment comment, User user, ReactionType type) {
        this.comment = comment;
        this.user = user;
        this.type = type;
    }

    public Long getId() { return id; }
    public ForumComment getComment() { return comment; }
    public User getUser() { return user; }
    public ReactionType getType() { return type; }
    public void setType(ReactionType type) { this.type = type; }
    public Instant getCreatedAt() { return createdAt; }
}
