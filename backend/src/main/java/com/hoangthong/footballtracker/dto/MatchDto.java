package com.hoangthong.footballtracker.dto;

/**
 * Du lieu tran dau da lam phang, tra ve cho frontend.
 * homeScore/awayScore la null neu tran chua dien ra.
 */
public record MatchDto(
        long id,
        String utcDate,
        String status,
        Integer matchday,
        String stage,
        long homeTeamId,
        String homeTeam,
        String homeCrest,
        long awayTeamId,
        String awayTeam,
        String awayCrest,
        Integer homeScore,
        Integer awayScore
) {
}
