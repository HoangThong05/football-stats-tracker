package com.hoangthong.footballtracker.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/**
 * Map dung theo JSON tra ve tu GET /v4/competitions/{code}/matches
 * cua football-data.org (co ho tro filter ?dateFrom=&dateTo=).
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record MatchesApiResponse(List<Match> matches) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Match(
            long id,
            String utcDate,
            String status,
            Integer matchday,
            String stage,
            StandingsApiResponse.Team homeTeam,
            StandingsApiResponse.Team awayTeam,
            Score score
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Score(String winner, ScorePart fullTime) {
    }

    // Dung Integer (khong phai int) vi tran chua da thi home/away la null.
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ScorePart(Integer home, Integer away) {
    }
}
