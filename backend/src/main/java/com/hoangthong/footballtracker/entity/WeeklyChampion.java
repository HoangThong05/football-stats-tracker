package com.hoangthong.footballtracker.entity;

import jakarta.persistence.*;

import java.time.Instant;

/**
 * Nguoi du doan diem cao nhat MOT tuan (Nhat tuan).
 *
 * Ban ghi nay vua la HUY HIEU (hien tren ho so + BXH) vua la THONG BAO chuc mung (chuong
 * doc ra). Trao boi WeeklyChampionService moi tuan mot lan.
 *
 * Hoa nhau thi luu nhieu dong cung weekStart (moi nguoi mot dong) - rang buoc duy nhat la
 * (user, weekStart) chu khong phai chi weekStart.
 */
@Entity
@Table(name = "weekly_champion",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "week_start"}),
        indexes = @Index(name = "idx_weekly_champion_user", columnList = "user_id, week_start"))
public class WeeklyChampion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private long userId;

    /** Thu 2 dau tuan (00:00 gio VN) - moc dinh danh cua tuan. */
    @Column(name = "week_start", nullable = false)
    private Instant weekStart;

    /** So diem ma nha vo dich tuan dat duoc. */
    @Column(nullable = false)
    private int points;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected WeeklyChampion() {
        // JPA can
    }

    public WeeklyChampion(long userId, Instant weekStart, int points) {
        this.userId = userId;
        this.weekStart = weekStart;
        this.points = points;
    }

    public Long getId() { return id; }
    public long getUserId() { return userId; }
    public Instant getWeekStart() { return weekStart; }
    public int getPoints() { return points; }
    public Instant getCreatedAt() { return createdAt; }
}
