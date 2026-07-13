package com.hoangthong.footballtracker.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;

/**
 * 1 huy hieu thanh tich ma 1 user da dat duoc (vd: PROPHET, WIN_STREAK - xem BadgeType).
 * Chi ghi 1 dong khi user LAN DAU du dieu kien; khong bi thu hoi ve sau.
 */
@Entity
@Table(name = "user_badge", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "badge_code"}))
public class UserBadge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "badge_code", nullable = false)
    private String badgeCode;

    @Column(nullable = false)
    private Instant earnedAt = Instant.now();

    protected UserBadge() {
        // JPA can
    }

    public UserBadge(User user, String badgeCode) {
        this.user = user;
        this.badgeCode = badgeCode;
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public String getBadgeCode() {
        return badgeCode;
    }

    public Instant getEarnedAt() {
        return earnedAt;
    }
}
