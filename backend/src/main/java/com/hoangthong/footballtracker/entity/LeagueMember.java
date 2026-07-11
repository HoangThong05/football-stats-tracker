package com.hoangthong.footballtracker.entity;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Thanh vien cua mot phong Mini League.
 * Moi user chi co the tham gia 1 lan moi phong (unique constraint).
 */
@Entity
@Table(name = "league_member",
       uniqueConstraints = @UniqueConstraint(columnNames = {"league_id", "user_id"}))
public class LeagueMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "league_id", nullable = false)
    private MiniLeague league;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private Instant joinedAt = Instant.now();

    protected LeagueMember() {}

    public LeagueMember(MiniLeague league, User user) {
        this.league = league;
        this.user = user;
    }

    public Long getId() { return id; }
    public MiniLeague getLeague() { return league; }
    public User getUser() { return user; }
    public Instant getJoinedAt() { return joinedAt; }
}
