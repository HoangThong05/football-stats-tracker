package com.hoangthong.footballtracker.dto;

/**
 * So lieu tong quan cho trang quan tri.
 *
 * quotaRemaining = so request con lai trong phut hien tai ma football-data.org bao ve
 * o lan goi gan nhat; null neu tu luc khoi dong chua goi lan nao. quotaSeenAt cho biet
 * con so do cu bao lau - khong co no thi khong biet dang xem so cua 5 giay hay 2 tieng truoc.
 */
public record AdminStatsDto(
        long users,
        long admins,
        long predictions,
        long miniLeagues,
        long syncedMatches,
        Integer quotaRemaining,
        String quotaSeenAt
) {
}
