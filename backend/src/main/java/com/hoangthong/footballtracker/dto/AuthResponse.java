package com.hoangthong.footballtracker.dto;

public record AuthResponse(String token, String email, String role) {
}
