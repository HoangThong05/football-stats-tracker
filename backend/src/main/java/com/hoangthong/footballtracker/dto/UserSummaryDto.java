package com.hoangthong.footballtracker.dto;

/**
 * Thong tin tom tat 1 nguoi dung, tra ve cho trang quan tri (khong bao gom mat khau).
 */
public record UserSummaryDto(long id, String email, String role, String createdAt) {
}
