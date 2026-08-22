package com.hoangthong.footballtracker.dto;

/**
 * Mot nguoi trong danh sach ban be / loi moi.
 * Khong co email - danh sach nay hien ten hien thi giong moi cho khac.
 */
public record FriendDto(long userId, String name, String since) {
}
