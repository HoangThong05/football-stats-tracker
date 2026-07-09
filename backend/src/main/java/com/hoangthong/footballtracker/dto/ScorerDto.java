package com.hoangthong.footballtracker.dto;

/**
 * 1 dong bang xep hang vua pha luoi, tra ve cho frontend.
 * assists co the null neu goi mien phi khong tra ve.
 */
public record ScorerDto(
        int rank,
        long playerId,
        String playerName,
        String nationality,
        long teamId,
        String teamName,
        String teamCrest,
        Integer playedMatches,
        Integer goals,
        Integer assists
) {
}
