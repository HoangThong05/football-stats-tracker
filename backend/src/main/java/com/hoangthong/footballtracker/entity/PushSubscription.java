package com.hoangthong.footballtracker.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * Mot dang ky nhan thong bao day (Web Push) cua mot thiet bi/trinh duyet.
 *
 * Moi trinh duyet ma nguoi dung bam "Bat thong bao" tao ra mot ban ghi: endpoint la
 * dia chi rieng do trinh duyet cap, p256dh + auth la khoa de ma hoa noi dung day. Mot
 * nguoi co the co nhieu dang ky (dien thoai, may tinh...) nen tra ve theo user.
 *
 * endpoint la duy nhat: bam "Bat" lai tren cung mot trinh duyet thi cap nhat ban ghi cu
 * chu khong tao trung.
 */
@Entity
@Table(name = "push_subscription")
public class PushSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, unique = true, length = 1000)
    private String endpoint;

    @Column(nullable = false, length = 255)
    private String p256dh;

    @Column(nullable = false, length = 255)
    private String auth;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected PushSubscription() {
        // JPA can
    }

    public PushSubscription(User user, String endpoint, String p256dh, String auth) {
        this.user = user;
        this.endpoint = endpoint;
        this.p256dh = p256dh;
        this.auth = auth;
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public String getEndpoint() {
        return endpoint;
    }

    public String getP256dh() {
        return p256dh;
    }

    public String getAuth() {
        return auth;
    }

    /** Doi khoa khi cung mot endpoint dang ky lai (trinh duyet co the cap khoa moi). */
    public void updateKeys(String p256dh, String auth) {
        this.p256dh = p256dh;
        this.auth = auth;
    }
}
