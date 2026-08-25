package com.hoangthong.footballtracker.entity;

import jakarta.persistence.*;

import java.time.Instant;

/**
 * Thong bao toan he thong do ADMIN gui - hien tren chuong cho MOI nguoi dung (va day push).
 *
 * Khac voi thong bao dien dan (rieng tung nguoi): day la mot ban tin chung, ai cung thay.
 */
@Entity
@Table(name = "announcement")
public class Announcement {

    public static final int MAX_TITLE = 120;
    public static final int MAX_BODY = 1000;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = MAX_TITLE)
    private String title;

    @Column(nullable = false, length = MAX_BODY)
    private String body;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected Announcement() {
        // JPA can
    }

    public Announcement(String title, String body) {
        this.title = title;
        this.body = body;
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getBody() { return body; }
    public Instant getCreatedAt() { return createdAt; }
}
