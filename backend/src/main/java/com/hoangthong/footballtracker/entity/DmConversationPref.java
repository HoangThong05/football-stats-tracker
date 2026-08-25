package com.hoangthong.footballtracker.entity;

import jakarta.persistence.*;

import java.time.Instant;

/**
 * Tuy chinh cua MOT nguoi cho hoi thoai voi MOT nguoi khac: ghim, tat thong bao, da xoa.
 *
 * Rieng cho tung nguoi xem (owner) - ghim/tat thong bao/xoa cua minh khong anh huong doi phuong.
 * "Xoa" chi la don lich su ve phia minh: clearedAt = luc xoa, chi con thay tin moi hon moc do.
 */
@Entity
@Table(name = "dm_conversation_pref",
        uniqueConstraints = @UniqueConstraint(columnNames = {"owner_id", "partner_id"}))
public class DmConversationPref {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id")
    private User owner;

    @Column(name = "partner_id", nullable = false)
    private long partnerId;

    @Column
    private Boolean pinned;

    @Column
    private Boolean muted;

    @Column
    private Instant clearedAt;

    protected DmConversationPref() {
        // JPA can
    }

    public DmConversationPref(User owner, long partnerId) {
        this.owner = owner;
        this.partnerId = partnerId;
    }

    public Long getId() { return id; }
    public User getOwner() { return owner; }
    public long getPartnerId() { return partnerId; }

    public boolean isPinned() { return Boolean.TRUE.equals(pinned); }
    public void setPinned(boolean pinned) { this.pinned = pinned; }

    public boolean isMuted() { return Boolean.TRUE.equals(muted); }
    public void setMuted(boolean muted) { this.muted = muted; }

    public Instant getClearedAt() { return clearedAt; }
    public void setClearedAt(Instant clearedAt) { this.clearedAt = clearedAt; }
}
