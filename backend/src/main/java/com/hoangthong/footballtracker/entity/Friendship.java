package com.hoangthong.footballtracker.entity;

import jakarta.persistence.*;

import java.time.Instant;

/**
 * Mot moi quan he ket ban, luu DUNG MOT dong cho moi cap.
 *
 * requester = nguoi gui loi moi, addressee = nguoi nhan. Khi PENDING thi chieu nay quan
 * trong (chi addressee moi duoc bam dong y); khi ACCEPTED thi hai chieu nhu nhau.
 *
 * Rang buoc duy nhat tren (requester, addressee) chi chan duoc TRUNG THEO CHIEU. Chieu
 * nguoc lai - A moi B trong khi B da moi A - phai chan bang cach tra cuu ca hai chieu
 * truoc khi tao (xem FriendshipService.request).
 */
@Entity
@Table(name = "friendship",
        uniqueConstraints = @UniqueConstraint(columnNames = {"requester_id", "addressee_id"}),
        indexes = {
                @Index(name = "idx_friendship_requester", columnList = "requester_id"),
                @Index(name = "idx_friendship_addressee", columnList = "addressee_id")
        })
public class Friendship {

    public enum Status { PENDING, ACCEPTED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "requester_id")
    private User requester;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "addressee_id")
    private User addressee;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.PENDING;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    /**
     * Luc loi moi duoc chap nhan. null = chua chap nhan (con PENDING), HOAC la quan he
     * ket ban tu truoc khi co cot nay.
     *
     * De null duoc (khong NOT NULL): bang friendship da co san du lieu, Hibernate che do
     * update them cot bang ALTER TABLE - khai NOT NULL khong mac dinh thi Postgres tu choi.
     * Cac quan he cu vi the co acceptedAt null, nen khong bao gio lot vao "vua chap nhan"
     * -> khong bung thong bao nguoc ve qua khu.
     */
    @Column
    private Instant acceptedAt;

    protected Friendship() {
        // JPA can
    }

    public Friendship(User requester, User addressee) {
        this.requester = requester;
        this.addressee = addressee;
    }

    public Long getId() { return id; }
    public User getRequester() { return requester; }
    public User getAddressee() { return addressee; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public Instant getAcceptedAt() { return acceptedAt; }

    /** Chuyen sang da ket ban va ghi lai thoi diem - luon di cung nhau. */
    public void markAccepted() {
        this.status = Status.ACCEPTED;
        this.acceptedAt = Instant.now();
    }
    public Instant getCreatedAt() { return createdAt; }

    /** Nguoi con lai trong cap, nhin tu goc do cua userId. */
    public User other(Long userId) {
        return requester.getId().equals(userId) ? addressee : requester;
    }
}
