package com.hoangthong.footballtracker.dto;

import java.time.Instant;

/**
 * Mot huy hieu vua dat duoc gan day - cho dong "chuc mung" tren chuong.
 * Ten + bieu tuong hien thi lay tu BADGE_META ben frontend theo code.
 */
public record RecentBadgeDto(String code, Instant earnedAt) {
}
