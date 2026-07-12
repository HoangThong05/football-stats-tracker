package com.hoangthong.footballtracker.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record SportsDbPlayersResponse(List<SportsDbPlayer> player) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record SportsDbPlayer(
            String idPlayer,
            String strPlayer,
            String strPosition,
            String strNationality,
            String dateBorn,
            String strThumb
    ) {}
}