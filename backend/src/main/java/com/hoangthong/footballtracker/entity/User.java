package com.hoangthong.footballtracker.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;

@Entity
@Table(name = "app_user", uniqueConstraints = @UniqueConstraint(columnNames = "email"))
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role = Role.USER;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    /**
     * Tai khoan bi khoa thi khong dang nhap duoc va moi request kem token deu bi tu choi.
     *
     * Kieu Boolean (cho phep null) chu KHONG phai boolean nguyen thuy, va coi null la
     * "khong bi khoa": Hibernate chay che do update se them cot nay vao bang DA CO SAN
     * du lieu. Khai bao NOT NULL ma khong co gia tri mac dinh thi Postgres tu choi thang
     * lenh ALTER TABLE, app khong khoi dong duoc. De null thi cac dong cu doc ra la
     * binh thuong, khong ai bi khoa oan.
     */
    @Column
    private Boolean enabled;

    /**
     * Ten nguoi khac nhin thay o bang xep hang va trong phong dau.
     *
     * Truoc day cac bang do hien EMAIL DAY DU cua moi nguoi, ma bang xep hang du doan la
     * trang cong khai - ai vao cung doc duoc dia chi email cua nguoi choi. null = chua
     * dat, khi do dung phan truoc dau @ lam ten (xem displayNameOrFallback()).
     */
    @Column(length = 30)
    private String displayName;

    /**
     * Tang len moi lan doi mat khau, de vo hieu toan bo token da phat truoc do.
     *
     * Khong co no thi doi mat khau gan nhu vo nghia ve bao mat: JWT song 24 gio va
     * khong the thu hoi, nen ke da trom duoc token van dung tiep binh thuong den het
     * han - dung luc nan nhan tuong minh vua khoa cua lai.
     *
     * null = token phat truoc khi co tinh nang nay -> coi la 0, khop voi claim thieu,
     * nen nguoi dang dang nhap khong bi da ra ngoai luc trien khai.
     */
    @Column
    private Integer tokenVersion;

    /**
     * false = tai khoan tao bang Google, chua tu dat mat khau bao gio.
     *
     * Tai khoan kieu do van co passwordHash (chuoi ngau nhien) nhung chu nhan khong
     * he biet no. Bat ho nhap "mat khau hien tai" thi khong bao gio dung duoc - phai
     * cho dat thang mat khau moi, phien dang nhap da la bang chung danh tinh roi.
     *
     * null = tai khoan cu, coi nhu CO mat khau (dung voi hau het), truong hop con lai
     * van con duong quen mat khau de tu dat.
     */
    @Column
    private Boolean hasPassword;

    protected User() {
        // JPA can
    }

    public User(String email, String passwordHash) {
        this.email = email;
        this.passwordHash = passwordHash;
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    /** null = tai khoan cu, co truoc khi co tinh nang khoa -> coi nhu binh thuong. */
    public boolean isEnabled() {
        return enabled == null || enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    /** Ten de hien ra ngoai. Chua dat thi lay phan truoc dau @ - khong bao gio lo ca dia chi. */
    public String displayNameOrFallback() {
        if (displayName != null && !displayName.isBlank()) {
            return displayName;
        }
        return fallbackName(email);
    }

    /** Dung chung cho cac truy van chi lay duoc email (BXH gom nhom theo email). */
    public static String fallbackName(String email) {
        if (email == null || email.isBlank()) {
            return "";
        }
        int at = email.indexOf('@');
        return at > 0 ? email.substring(0, at) : email;
    }

    /** null = token doi cu, coi la 0. */
    public int getTokenVersion() {
        return tokenVersion == null ? 0 : tokenVersion;
    }

    /** Goi sau moi lan doi mat khau: moi token da phat deu het gia tri. */
    public void bumpTokenVersion() {
        this.tokenVersion = getTokenVersion() + 1;
    }

    /** null = tai khoan cu, coi nhu da co mat khau. */
    public boolean hasPassword() {
        return hasPassword == null || hasPassword;
    }

    public void setHasPassword(boolean hasPassword) {
        this.hasPassword = hasPassword;
    }

    @Column
private String resetToken;

@Column
private Instant resetTokenExpiry;

public String getResetToken() { return resetToken; }
public Instant getResetTokenExpiry() { return resetTokenExpiry; }

public void setResetToken(String resetToken) { this.resetToken = resetToken; }
public void setResetTokenExpiry(Instant resetTokenExpiry) { this.resetTokenExpiry = resetTokenExpiry; }

public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
}
