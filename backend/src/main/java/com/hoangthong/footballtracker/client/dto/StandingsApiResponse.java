package com.hoangthong.footballtracker.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/**
 * Cac DTO nay map dung theo JSON tra ve tu
 * GET /v4/competitions/{code}/standings cua football-data.org.
 * @JsonIgnoreProperties(ignoreUnknown = true) => bo qua cac truong ta khong dung.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record StandingsApiResponse(
        Competition competition,
        List<StandingBlock> standings,
        Season season
) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Competition(String name, String emblem) {
    }

    /** Mua giai ma bang xep hang nay thuoc ve (football-data.org tu chon "mua hien tai" theo giai). */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Season(String startDate, String endDate, Integer currentMatchday) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record StandingBlock(String stage, String type, List<TableEntry> table) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record TableEntry(
            int position,
            Team team,
            int playedGames,
            int won,
            int draw,
            int lost,
            int points,
            int goalsFor,
            int goalsAgainst,
            int goalDifference
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Team(long id, String name, String shortName, String tla, String crest) {
    }
}
