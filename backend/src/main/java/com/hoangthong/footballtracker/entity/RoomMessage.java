package com.hoangthong.footballtracker.entity;

import jakarta.persistence.*;

import java.time.Instant;

/** Mot tin nhan trong phong Mini League. */
@Entity
@Table(name = "room_message",
        indexes = @Index(name = "idx_room_message_league", columnList = "league_id, createdAt"))
public class RoomMessage {

    /** Gioi han do dai: day la khung chat, khong phai cho viet bai. */
    public static final int MAX_LENGTH = 500;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "league_id")
    private MiniLeague league;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id")
    private User author;

    @Column(nullable = false, length = MAX_LENGTH)
    private String content;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected RoomMessage() {
        // JPA can
    }

    public RoomMessage(MiniLeague league, User author, String content) {
        this.league = league;
        this.author = author;
        this.content = content;
    }

    public Long getId() { return id; }
    public MiniLeague getLeague() { return league; }
    public User getAuthor() { return author; }
    public String getContent() { return content; }
    public Instant getCreatedAt() { return createdAt; }
}
