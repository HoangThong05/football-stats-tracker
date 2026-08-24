package com.hoangthong.footballtracker.dto;

/**
 * 1 huy hieu thanh tich: ma badge (khop ten trong BadgeType), da dat hay chua,
 * tien do hien tai / muc tieu can dat (progress luon <= target).
 *
 * @param featured true = huy hieu nguoi dung chon ghim canh ten (chi 1 cai duoc featured).
 */
public record BadgeDto(String code, boolean earned, int progress, int target, boolean featured) {
}
