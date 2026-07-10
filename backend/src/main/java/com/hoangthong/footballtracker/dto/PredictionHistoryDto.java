package com.hoangthong.footballtracker.dto;

/**
 * 1 dong lich su du doan cua user: du doan cua ho + ket qua that (neu tran da xong) + diem.
 */
public record PredictionHistoryDto(
        long matchId,
        String competition,
        String utcDate,
        String status,
        String homeTeam,
        String homeCrest,
        String awayTeam,
        String awayCrest,
        Integer actualHomeScore,
        Integer actualAwayScore,
        int predictedHomeScore,
        int predictedAwayScore,
        Integer points
) {
}
