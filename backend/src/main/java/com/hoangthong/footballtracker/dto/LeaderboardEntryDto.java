package com.hoangthong.footballtracker.dto;

/**
 * @param name ten hien thi cua nguoi choi. KHONG dua email ra day: bang xep hang du doan
 *             la trang cong khai, ai vao cung doc duoc - truoc day no lo dia chi email
 *             cua tat ca nguoi choi.
 */
public record LeaderboardEntryDto(int rank, long userId, String name,
                                  /** Anh dai dien. null = chua dat. */
                                  String avatarUrl,
                                  /** Ma huy hieu ghim canh ten. null = khong ghim. */
                                  String featuredBadge,
                                  long totalPoints, long totalPredictions) {
}
