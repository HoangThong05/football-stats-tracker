package com.hoangthong.footballtracker.entity;

import jakarta.persistence.*;

import java.time.Instant;

/** Mot bai viet tren dien dan cong khai. */
@Entity
@Table(name = "forum_post", indexes = @Index(name = "idx_forum_post_created", columnList = "createdAt"))
public class ForumPost {

    public static final int MAX_CONTENT = 2000;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id")
    private User author;

    @Column(nullable = false, length = MAX_CONTENT)
    private String content;

    /**
     * Duong dan anh tren Cloudinary. null = bai chi co chu.
     *
     * Chi luu URL, KHONG luu file: may chu Render goi free co o dia tam, deploy mot ban
     * la anh nguoi dung bay sach.
     */
    @Column(length = 500)
    private String imageUrl;

    /** Bi an di boi admin. Giu lai dong thay vi xoa han de con dau vet khi can doi chieu. */
    @Column(nullable = false)
    private boolean hidden = false;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected ForumPost() {
        // JPA can
    }

    public ForumPost(User author, String content, String imageUrl) {
        this.author = author;
        this.content = content;
        this.imageUrl = imageUrl;
    }

    public Long getId() { return id; }
    public User getAuthor() { return author; }
    public String getContent() { return content; }
    public String getImageUrl() { return imageUrl; }
    public boolean isHidden() { return hidden; }
    public void setHidden(boolean hidden) { this.hidden = hidden; }
    public Instant getCreatedAt() { return createdAt; }
}
