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
        /** Ma giai (PL, PD...) - frontend can de goi bang xep hang lay phong do 2 doi. */
        String competitionCode,
        String competitionEmblem,
        String venue,
        long homeTeamId,
        String homeTeam,
        String homeCrest,
        long awayTeamId,
        String awayTeam,
        String awayCrest,
        Integer homeScore,
        Integer awayScore,
        Integer homeHalfScore,
        Integer awayHalfScore,
        List<String> referees
) {
}
