package com.hoangthong.footballtracker.entity;

import jakarta.persistence.*;

import java.time.Instant;

/**
 * Tin nhan rieng 1-1 giua hai nguoi (chi ban be moi gui duoc - kiem o service).
 *
 * Khong co bang "hoi thoai" rieng: mot hoi thoai la tap cac tin giua A va B, suy ra tu
 * chinh bang nay. readAt != null nghia la nguoi nhan da doc (cho dau "Da xem").
 */
@Entity
@Table(name = "direct_message", indexes = {
        @Index(name = "idx_dm_pair", columnList = "sender_id, recipient_id, createdAt"),
        @Index(name = "idx_dm_unread", columnList = "recipient_id, readAt")
})
public class DirectMessage {

    public static final int MAX_LENGTH = 2000;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sender_id")
    private User sender;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipient_id")
    private User recipient;

    /** Noi dung chu. Co the null neu chi gui anh/GIF. */
    @Column(length = MAX_LENGTH)
    private String content;

    /** Anh/GIF dinh kem (Cloudinary). null = tin chi co chu. */
    @Column(length = 500)
    private String imageUrl;

    /** Tin dang tra loi (reply). null = tin thuong. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reply_to_id")
    private DirectMessage replyTo;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    /** Luc nguoi nhan doc tin. null = chua doc. */
    @Column
    private Instant readAt;

    /** true = da thu hoi VOI MOI NGUOI -> hai ben thay "Tin nhan da thu hoi". */
    @Column
    private Boolean recalled;

    /** Da an rieng cho tung ben ("thu hoi voi ban") - chi ben do khong thay nua. */
    @Column
    private Boolean hiddenForSender;
    @Column
    private Boolean hiddenForRecipient;

    /** true = tin da ghim (hien o dau hoi thoai). */
    @Column
    private Boolean pinned;

    protected DirectMessage() {
        // JPA can
    }

    public DirectMessage(User sender, User recipient, String content, String imageUrl) {
        this.sender = sender;
        this.recipient = recipient;
        this.content = (content == null || content.isBlank()) ? null : content;
        this.imageUrl = (imageUrl == null || imageUrl.isBlank()) ? null : imageUrl;
    }

    public Long getId() { return id; }
    public User getSender() { return sender; }
    public User getRecipient() { return recipient; }
    public String getContent() { return content; }
    public String getImageUrl() { return imageUrl; }
    public DirectMessage getReplyTo() { return replyTo; }
    public void setReplyTo(DirectMessage replyTo) { this.replyTo = replyTo; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getReadAt() { return readAt; }

    public void markRead() {
        if (readAt == null) {
            readAt = Instant.now();
        }
    }

    public boolean isRecalled() { return Boolean.TRUE.equals(recalled); }
    public void recall() { this.recalled = true; }

    public boolean isHiddenForSender() { return Boolean.TRUE.equals(hiddenForSender); }
    public boolean isHiddenForRecipient() { return Boolean.TRUE.equals(hiddenForRecipient); }
    public void hideForSender() { this.hiddenForSender = true; }
    public void hideForRecipient() { this.hiddenForRecipient = true; }

    public boolean isPinned() { return Boolean.TRUE.equals(pinned); }
    public void setPinned(boolean pinned) { this.pinned = pinned; }
}
