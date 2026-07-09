package com.hoangthong.footballtracker.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

/**
 * Cache dung Caffeine. Nho co cache nay, ta khong goi football-data.org moi lan
 * nguoi dung tai trang => tranh vuot gioi han 10 request/phut cua goi mien phi.
 *
 * TTL mac dinh 30 phut: du lieu bong da (bang xep hang, vua pha luoi) khong doi
 * theo tung phut. TTL cang dai => cang it request => cang it bi API lam cham (throttle).
 * Doi qua app.cache.ttl-minutes neu muon.
 */
@Configuration
public class CacheConfig {

    public static final String STANDINGS_CACHE = "standings";
    public static final String MATCHES_CACHE = "matches";
    public static final String TEAMS_CACHE = "teams";
    public static final String SCORERS_CACHE = "scorers";

    private final long ttlMinutes;
    private final long maxSize;

    public CacheConfig(
            @Value("${app.cache.ttl-minutes:30}") long ttlMinutes,
            @Value("${app.cache.max-size:200}") long maxSize) {
        this.ttlMinutes = ttlMinutes;
        this.maxSize = maxSize;
    }

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager(
                STANDINGS_CACHE, MATCHES_CACHE, TEAMS_CACHE, SCORERS_CACHE);
        manager.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(Duration.ofMinutes(ttlMinutes))
                .maximumSize(maxSize));
        return manager;
    }
}
