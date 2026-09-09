package com.hoangthong.footballtracker.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/** Cac phan hoi tu TheSportsDB (v1) - chi lay truong can cho ANH cau thu. */
public final class TheSportsDbResponses {

    private TheSportsDbResponses() {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record SearchTeams(List<Team> teams) {
        @JsonIgnoreProperties(ignoreUnknown = true)
        public record Team(String idTeam, String strTeam, String strSport, String strGender) {}
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record AllPlayers(List<Player> player) {
        @JsonIgnoreProperties(ignoreUnknown = true)
        public record Player(String strPlayer, String strThumb, String strCutout) {}
    }
}
