package com.hoangthong.footballtracker.entity;

import jakarta.persistence.*;

/**
 * Mot luot thich. Rang buoc duy nhat (post, user) de mot nguoi khong thich duoc hai lan
 * du co bam nhanh den may hay goi thang API.
 */
@Entity
@Table(name = "post_like",
        uniqueConstraints = @UniqueConstraint(columnNames = {"post_id", "user_id"}))
public class PostLike {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "post_id")
    private ForumPost post;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    protected PostLike() {
        // JPA can
    }

    public PostLike(ForumPost post, User user) {
        this.post = post;
        this.user = user;
    }

    public Long getId() { return id; }
}
