package com.hoangthong.footballtracker.dto;

public record PredictionRequest(long matchId, int homeScore, int awayScore) {
}
