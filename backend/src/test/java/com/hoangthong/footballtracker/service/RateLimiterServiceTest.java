package com.hoangthong.footballtracker.service;

import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;

class RateLimiterServiceTest {

    @Test
    void cho_qua_dung_so_lan_gioi_han_roi_chan() {
        RateLimiterService limiter = new RateLimiterService();

        assertThat(limiter.tryConsume("a", 3, Duration.ofHours(1))).isTrue();
        assertThat(limiter.tryConsume("a", 3, Duration.ofHours(1))).isTrue();
        assertThat(limiter.tryConsume("a", 3, Duration.ofHours(1))).isTrue();
        assertThat(limiter.tryConsume("a", 3, Duration.ofHours(1))).isFalse();
        assertThat(limiter.tryConsume("a", 3, Duration.ofHours(1))).isFalse();
    }

    @Test
    void moi_khoa_dem_rieng() {
        RateLimiterService limiter = new RateLimiterService();

        assertThat(limiter.tryConsume("email:a@x.com", 1, Duration.ofHours(1))).isTrue();
        assertThat(limiter.tryConsume("email:a@x.com", 1, Duration.ofHours(1))).isFalse();
        // Khoa khac phai khong bi anh huong
        assertThat(limiter.tryConsume("email:b@x.com", 1, Duration.ofHours(1))).isTrue();
    }

    @Test
    void het_cua_so_thi_dem_lai_tu_dau() throws InterruptedException {
        RateLimiterService limiter = new RateLimiterService();
        Duration window = Duration.ofMillis(100);

        assertThat(limiter.tryConsume("a", 1, window)).isTrue();
        assertThat(limiter.tryConsume("a", 1, window)).isFalse();

        Thread.sleep(150);

        assertThat(limiter.tryConsume("a", 1, window)).isTrue();
    }
}
