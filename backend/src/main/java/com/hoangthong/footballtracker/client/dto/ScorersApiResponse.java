package com.hoangthong.footballtracker.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/**
 * Map theo JSON tra ve tu GET /v4/competitions/{code}/scorers cua football-data.org.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record ScorersApiResponse(List<Scorer> scorers) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Scorer(
            Player player,
            StandingsApiResponse.Team team,
            Integer playedMatches,
            Integer goals,
            Integer assists,
            Integer penalties
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Player(long id, String name, String nationality) {
    }
}
