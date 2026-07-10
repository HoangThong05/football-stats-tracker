package com.hoangthong.footballtracker.dto;

public record LeaderboardEntryDto(int rank, String email, long totalPoints, long totalPredictions) {
}
