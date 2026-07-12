package com.hoangthong.footballtracker.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ApiFootballSquadResponse(List<SquadWrapper> response) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record SquadWrapper(TeamInfo team, List<PlayerInfo> players) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record TeamInfo(long id, String name) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record PlayerInfo(long id, String name, Integer age, Integer number, String position, String photo) {}
}