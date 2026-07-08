package com.hoangthong.footballtracker.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/**
 * Map dung theo JSON tra ve tu GET /v4/teams/{id} cua football-data.org.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record TeamApiResponse(
        long id,
        String name,
        String shortName,
        String tla,
        String crest,
        Integer founded,
        String venue,
        String clubColors,
        String website,
        Coach coach,
        List<Player> squad
) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Coach(String name, String nationality) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Player(long id, String name, String position, String nationality, String dateOfBirth) {
    }
}
