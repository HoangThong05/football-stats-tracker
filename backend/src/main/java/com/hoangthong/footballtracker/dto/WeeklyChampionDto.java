package com.hoangthong.footballtracker.dto;

import java.time.Instant;

/** Mot lan Nhat tuan: moc dau tuan, so diem, va luc duoc trao (de chuong xep + danh dau da xem). */
public record WeeklyChampionDto(Instant weekStart, int points, Instant awardedAt) {
}
