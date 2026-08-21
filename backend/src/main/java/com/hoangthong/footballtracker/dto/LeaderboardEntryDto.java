package com.hoangthong.footballtracker.dto;

/**
 * @param name ten hien thi cua nguoi choi. KHONG dua email ra day: bang xep hang du doan
 *             la trang cong khai, ai vao cung doc duoc - truoc day no lo dia chi email
 *             cua tat ca nguoi choi.
 */
public record LeaderboardEntryDto(int rank, String name, long totalPoints, long totalPredictions) {
}
