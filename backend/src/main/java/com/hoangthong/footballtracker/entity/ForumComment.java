package com.hoangthong.footballtracker.entity;

import jakarta.persistence.*;

import java.time.Instant;

/** Binh luan duoi mot bai viet. */
@Entity
@Table(name = "forum_comment", indexes = @Index(name = "idx_forum_comment_post", columnList = "post_id, createdAt"))
public class ForumComment {

    public static final int MAX_CONTENT = 1000;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "post_id")
    private ForumPost post;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id")
    private User author;

    /**
     * Binh luan cha, null = binh luan goc.
     *
     * CHI LONG MOT CAP: tra loi cua tra loi van gan vao binh luan goc (xu ly o
     * ForumService.comment). Long nhieu cap thi tren dien thoai cac muc thut dan vao
     * den muc chi con vai chu moi dong.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private ForumComment parent;

    @Column(nullable = false, length = MAX_CONTENT)
    private String content;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected ForumComment() {
        // JPA can
    }

    public ForumComment(ForumPost post, User author, String content, ForumComment parent) {
        this.post = post;
        this.author = author;
        this.content = content;
        this.parent = parent;
    }

    public Long getId() { return id; }
    public ForumPost getPost() { return post; }
    public User getAuthor() { return author; }
    public ForumComment getParent() { return parent; }
    public String getContent() { return content; }
    public Instant getCreatedAt() { return createdAt; }
}
