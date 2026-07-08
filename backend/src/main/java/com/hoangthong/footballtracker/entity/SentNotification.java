package com.hoangthong.footballtracker.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;

/**
 * Danh dau: da gui email nhac tran (matchId) cho user (userId) roi.
 * Nho bang nay, job chay lai moi gio se khong gui trung cung 1 tran cho cung 1 nguoi.
 */
@Entity
@Table(name = "sent_notification", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "match_id"}))
public class SentNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private long userId;

    @Column(name = "match_id", nullable = false)
    private long matchId;

    @Column(nullable = false)
    private Instant sentAt = Instant.now();

    protected SentNotification() {
        // JPA can
    }

    public SentNotification(long userId, long matchId) {
        this.userId = userId;
        this.matchId = matchId;
    }

    public Long getId() {
        return id;
    }

    public long getUserId() {
        return userId;
    }

    public long getMatchId() {
        return matchId;
    }

    public Instant getSentAt() {
        return sentAt;
    }
}
