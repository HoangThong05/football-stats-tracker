package com.hoangthong.footballtracker.dto;

/**
 * 1 huy hieu thanh tich: ma badge (khop ten trong BadgeType), da dat hay chua,
 * tien do hien tai / muc tieu can dat (progress luon <= target).
 */
public record BadgeDto(String code, boolean earned, int progress, int target) {
}
