package com.hoangthong.footballtracker.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record SportsDbTeamSearchResponse(List<SportsDbTeam> teams) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record SportsDbTeam(String idTeam, String strTeam) {}
}