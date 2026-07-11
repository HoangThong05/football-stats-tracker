package com.hoangthong.footballtracker.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/**
 * Map dung theo JSON tra ve tu GET /v4/matches/{id} cua football-data.org.
 * Goi mien phi KHONG tra ve doi hinh/su kien (ban thang, the phat) - chi co o goi tra phi.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record MatchDetailApiResponse(
        long id,
        String utcDate,
        String status,
        Integer matchday,
        String stage,
        String venue,
        Competition competition,
        StandingsApiResponse.Team homeTeam,
        StandingsApiResponse.Team awayTeam,
        MatchesApiResponse.Score score,
        List<Referee> referees
) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Competition(long id, String name, String emblem) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Referee(long id, String name, String nationality, String type) {
    }
}
