package com.hoangthong.footballtracker.entity;

import jakarta.persistence.*;

import java.time.Instant;

/**
 * Thong bao cho tac gia khi admin GO bai/binh luan cua ho, kem ly do.
 *
 * Phai luu thanh BANG RIENG chu khong suy ra nhu cac thong bao khac: bai/binh luan da bi
 * xoa mat, khong con nguon nao de doc ra "ai gia gi". Luu lai luc go, kem trich doan noi
 * dung da go de nguoi nhan biet la thu nao.
 */
@Entity
@Table(name = "moderation_notice",
        indexes = @Index(name = "idx_mod_notice_recipient", columnList = "recipient_id, createdAt"))
public class ModerationNotice {

    public static final int MAX_REASON = 200;
    public static final int MAX_EXCERPT = 120;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipient_id")
    private User recipient;

    /** POST hoac COMMENT - de cau thong bao noi dung thu gi bi go. */
    @Column(nullable = false, length = 20)
    private String targetType;

    @Column(length = MAX_REASON)
    private String reason;

    /** Trich ngan noi dung da go, de nguoi nhan nhan ra la bai/cmt nao. */
    @Column(length = MAX_EXCERPT)
    private String excerpt;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected ModerationNotice() {
        // JPA can
    }

    public ModerationNotice(User recipient, String targetType, String reason, String excerpt) {
        this.recipient = recipient;
        this.targetType = targetType;
        this.reason = reason;
        this.excerpt = excerpt;
    }

    public Long getId() { return id; }
    public User getRecipient() { return recipient; }
    public String getTargetType() { return targetType; }
    public String getReason() { return reason; }
    public String getExcerpt() { return excerpt; }
    public Instant getCreatedAt() { return createdAt; }
}
