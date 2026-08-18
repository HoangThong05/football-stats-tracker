package com.hoangthong.footballtracker.dto;

/**
 * Thong tin tom tat 1 nguoi dung, tra ve cho trang quan tri (khong bao gom mat khau).
 *
 * enabled = false nghia la tai khoan bi khoa: khong dang nhap duoc, va moi request kem
 * token cu cung bi tu choi ngay (xem JwtAuthFilter).
 */
public record UserSummaryDto(long id, String email, String role, String createdAt, boolean enabled) {
}
