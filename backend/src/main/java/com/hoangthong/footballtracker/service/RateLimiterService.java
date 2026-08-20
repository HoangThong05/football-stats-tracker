package com.hoangthong.footballtracker.service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;

/**
 * Dem so lan goi theo tung khoa, qua nguong thi chan.
 *
 * LY DO TON TAI: /auth/forgot-password gui email that qua Brevo, ma han muc chi
 * 300 thu/ngay. Khong chan thi mot vong lap curl vai giay la:
 *   - dội bom hop thu nan nhan bang hang tram link dat lai mat khau
 *   - dot sach han muc -> KHONG AI dat lai duoc mat khau cho den hom sau
 * Dong ho dem nguoc 60 giay o giao dien khong tinh: no chi ngan bam nham, ai goi
 * thang API thi khong vuong gi.
 *
 * Dung cua so co dinh (fixed window): don gian, du cho muc dich nay. Bo dem nam
 * trong bo nho nen restart la mat, va moi instance dem rieng - chap nhan duoc vi
 * app chi chay mot instance.
 */
@Service
public class RateLimiterService {

    /** Mot cua so dang dem: het han luc nao, da goi bao nhieu lan. */
    private record Window(Instant resetAt, int count) {}

    /*
     * expireAfterWrite dai hon moi cua so dang dung, de entry cu tu don. Han thuc su
     * cua tung cua so nam trong resetAt chu khong phai o day.
     */
    private final Cache<String, Window> counters = Caffeine.newBuilder()
            .expireAfterWrite(Duration.ofHours(2))
            .maximumSize(50_000)
            .build();

    /**
     * @return true neu con trong han muc (va da tinh lan goi nay), false neu vuot.
     */
    public boolean tryConsume(String key, int limit, Duration window) {
        Instant now = Instant.now();
        // compute() cua ConcurrentHashMap la nguyen tu -> hai request cung luc khong de sot
        Window w = counters.asMap().compute(key, (k, current) -> {
            if (current == null || !now.isBefore(current.resetAt())) {
                return new Window(now.plus(window), 1);
            }
            return new Window(current.resetAt(), current.count() + 1);
        });
        return w.count() <= limit;
    }

}
