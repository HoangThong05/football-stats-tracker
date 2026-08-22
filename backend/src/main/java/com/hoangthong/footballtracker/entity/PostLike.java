package com.hoangthong.footballtracker.entity;

import jakarta.persistence.*;

import java.time.Instant;

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

    /**
     * De null duoc (khong @Column(nullable = false)): bang post_like DA CO san du lieu,
     * Hibernate che do update se them cot nay bang ALTER TABLE - khai bao NOT NULL ma
     * khong co gia tri mac dinh thi Postgres tu choi, app khong khoi dong duoc.
     *
     * Cac luot thich cu vi the co createdAt = null. Dung nhu mong muon: chung khong bao
     * gio lot vao dieu kien "moi hon moc da xem" nen khong bung thong bao nguoc ve qua khu.
     */
    @Column
    private Instant createdAt = Instant.now();

    protected PostLike() {
        // JPA can
    }

    public PostLike(ForumPost post, User user) {
        this.post = post;
        this.user = user;
    }

    public Long getId() { return id; }
    public ForumPost getPost() { return post; }
    public User getUser() { return user; }

    /** null = luot thich co truoc khi co cot nay. */
    public Instant getCreatedAt() { return createdAt; }
}
