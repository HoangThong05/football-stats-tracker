package com.hoangthong.footballtracker.entity;

import jakarta.persistence.*;

import java.time.Instant;

/**
 * Bao cao mot bai viet vi pham.
 *
 * Dien dan cong khai thi khong the trong cho admin ngoi doc het - nguoi dung phai co
 * duong bao. Rang buoc duy nhat (post, reporter) de mot nguoi khong bao cao mot bai
 * nhieu lan lam nhieu so lieu.
 */
@Entity
@Table(name = "post_report",
        uniqueConstraints = @UniqueConstraint(columnNames = {"post_id", "reporter_id"}))
public class PostReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "post_id")
    private ForumPost post;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reporter_id")
    private User reporter;

    @Column(length = 200)
    private String reason;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected PostReport() {
        // JPA can
    }

    public PostReport(ForumPost post, User reporter, String reason) {
        this.post = post;
        this.reporter = reporter;
        this.reason = reason;
    }

    public Long getId() { return id; }
    public ForumPost getPost() { return post; }
    public User getReporter() { return reporter; }
    public String getReason() { return reason; }
    public Instant getCreatedAt() { return createdAt; }
}
