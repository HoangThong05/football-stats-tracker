package com.hoangthong.footballtracker.dto;

/** Mot thong bao toan he thong, hien tren chuong nguoi dung. */
public record AnnouncementDto(long id, String title, String body, String createdAt) {
}
