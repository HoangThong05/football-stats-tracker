package com.hoangthong.footballtracker.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * Ghi lai LAN CUOI da THU goi API-Football lay bang map doi (thanh cong hay that bai).
 *
 * Vi sao can luu xuong DB chu khong de trong RAM: khi tai khoan bi khoa / het quota,
 * API luon tra ve rong -> bang map trong DB cung trong -> neu khong nho "vua thu roi"
 * thi MOI lan co nguoi mo trang chi tiet doi la lai ban 6 request nua. Render goi free
 * con hay khoi dong lai (xoa sach RAM) nen chi nho trong RAM la khong du.
 *
 * Bang nay luon chi co DUNG 1 dong (id = 1).
 */
@Entity
@Table(name = "api_football_sync_state")
public class ApiFootballSyncState {

    public static final long SINGLETON_ID = 1L;

    @Id
    private Long id = SINGLETON_ID;

    /** Thoi diem lan THU gan nhat - ke ca khi that bai. */
    @Column(name = "last_attempt_at", nullable = false)
    private Instant lastAttemptAt = Instant.EPOCH;

    /** Thoi diem lan THANH CONG gan nhat (null neu chua bao gio thanh cong). */
    @Column(name = "last_success_at")
    private Instant lastSuccessAt;

    protected ApiFootballSyncState() {
        // JPA can
    }

    public ApiFootballSyncState(Instant lastAttemptAt) {
        this.id = SINGLETON_ID;
        this.lastAttemptAt = lastAttemptAt;
    }

    public Instant getLastAttemptAt() {
        return lastAttemptAt;
    }

    public Instant getLastSuccessAt() {
        return lastSuccessAt;
    }

    public void markAttempt(boolean success) {
        this.lastAttemptAt = Instant.now();
        if (success) {
            this.lastSuccessAt = this.lastAttemptAt;
        }
    }
}
