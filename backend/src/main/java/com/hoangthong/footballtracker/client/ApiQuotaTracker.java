package com.hoangthong.footballtracker.client;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Nho lai han muc con lai ma football-data.org bao ve o lan goi gan nhat.
 *
 * Truoc day con so nay chi duoc ghi vao log roi troi qua. Nhung dung no moi biet luc nao
 * sap cham tran 10 request/phut - ma cham tran chinh la thu da lam vo tab Lich thi dau:
 * API tra 429, MatchesService khong bat, thanh loi 500 truoc mat nguoi dung.
 *
 * AtomicReference vi web server chay nhieu luong: request nao cung co the ghi vao day,
 * va trang quan tri doc ra o mot luong khac. Doi ca cum (so + moc thoi gian) trong MOT
 * doi tuong bat bien de khong bao gio doc duoc so cua lan nay ghep voi gio cua lan truoc.
 */
@Component
public class ApiQuotaTracker {

    /** Chua goi lan nao ke tu khi khoi dong -> remaining = null. */
    public record Snapshot(Integer remaining, Instant seenAt) {
    }

    private final AtomicReference<Snapshot> latest = new AtomicReference<>(new Snapshot(null, null));

    public void record(int remaining) {
        latest.set(new Snapshot(remaining, Instant.now()));
    }

    public Snapshot latest() {
        return latest.get();
    }
}
