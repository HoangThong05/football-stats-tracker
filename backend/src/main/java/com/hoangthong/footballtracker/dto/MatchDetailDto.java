package com.hoangthong.footballtracker.dto;

import java.util.List;

/**
 * Chi tiet 1 tran dau da lam phang, tra ve cho frontend.
 * referees co the rong neu football-data.org chua gan trong tai (tran chua dien ra).
 */
public record MatchDetailDto(
        long id,
        String utcDate,
        String status,
        Integer matchday,
        String stage,
        String competition,
        String competitionEmblem,
        String venue,
        String homeTeam,
        String homeCrest,
        String awayTeam,
        String awayCrest,
        Integer homeScore,
        Integer awayScore,
        Integer homeHalfScore,
        Integer awayHalfScore,
        List<String> referees
) {
}
