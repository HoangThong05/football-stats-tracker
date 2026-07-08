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
 * 1 dong = 1 doi bong ma 1 user dang theo doi.
 * teamId la id ben football-data.org (khong phai FK trong DB cua ta).
 * Luu them teamName/teamCrest de hien thi ngay khong can goi lai API ngoai.
 */
@Entity
@Table(name = "favorite_team", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "team_id"}))
public class FavoriteTeam {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "team_id", nullable = false)
    private long teamId;

    @Column(nullable = false)
    private String teamName;

    private String teamCrest;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected FavoriteTeam() {
        // JPA can
    }

    public FavoriteTeam(User user, long teamId, String teamName, String teamCrest) {
        this.user = user;
        this.teamId = teamId;
        this.teamName = teamName;
        this.teamCrest = teamCrest;
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public long getTeamId() {
        return teamId;
    }

    public String getTeamName() {
        return teamName;
    }

    public String getTeamCrest() {
        return teamCrest;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
