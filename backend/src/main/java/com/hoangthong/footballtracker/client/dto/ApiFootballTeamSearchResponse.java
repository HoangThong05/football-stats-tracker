package com.hoangthong.footballtracker.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ApiFootballTeamSearchResponse(List<TeamWrapper> response) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record TeamWrapper(TeamInfo team) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record TeamInfo(long id, String name, String country) {}
}