package com.hoangthong.footballtracker.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

/**
 * Cache dung Caffeine: du lieu tu dong het han sau 5 phut.
 * Nho co cache nay, ta khong goi football-data.org moi lan nguoi dung tai trang
 * => tranh vuot gioi han 10 request/phut.
 */
@Configuration
public class CacheConfig {

    public static final String STANDINGS_CACHE = "standings";
    public static final String MATCHES_CACHE = "matches";
    public static final String TEAMS_CACHE = "teams";
    public static final String SCORERS_CACHE = "scorers";

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager(
                STANDINGS_CACHE, MATCHES_CACHE, TEAMS_CACHE, SCORERS_CACHE);
        manager.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(Duration.ofMinutes(5))
                .maximumSize(50));
        return manager;
    }
}
