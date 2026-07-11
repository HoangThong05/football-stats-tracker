package com.hoangthong.footballtracker.entity;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Mot "phong" du doan - nhom ban be cung du doan ket qua.
 * inviteCode: ma 6 ky tu de chia se cho ban be tham gia.
 */
@Entity
@Table(name = "mini_league")
public class MiniLeague {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "invite_code", nullable = false, unique = true, length = 6)
    private String inviteCode;

    /** Nguoi tao phong */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected MiniLeague() {}

    public MiniLeague(String name, String inviteCode, User owner) {
        this.name = name;
        this.inviteCode = inviteCode;
        this.owner = owner;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getInviteCode() { return inviteCode; }
    public User getOwner() { return owner; }
    public Instant getCreatedAt() { return createdAt; }
}
