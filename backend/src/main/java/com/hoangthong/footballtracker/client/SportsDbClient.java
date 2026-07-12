package com.hoangthong.footballtracker.client;

import com.hoangthong.footballtracker.client.dto.SportsDbPlayersResponse;
import com.hoangthong.footballtracker.client.dto.SportsDbTeamSearchResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;

/**
 * Client goi TheSportsDB (mien phi) de lay du lieu cau thu.
 * Ly do can them client rieng: goi mien phi cua football-data.org
 * KHONG tra ve squad (yeu cau goi Deep Data tra phi 29 EUR/thang).
 * Free test key "3" cua TheSportsDB: https://www.thesportsdb.com/free_starter_api.php
 */
@Component
public class SportsDbClient {

    private static final Logger log = LoggerFactory.getLogger(SportsDbClient.class);
    private static final String BASE_URL = "https://www.thesportsdb.com/api/v1/json/3";

    private final RestClient restClient = RestClient.create(BASE_URL);

    /**
     * Tim idTeam cua TheSportsDB theo ten doi bong (khac ID voi football-data.org).
     * Tra ve rong neu khong tim thay hoac ten khong khop.
     */
    public Optional<String> searchTeamId(String teamName) {
        try {
            String encoded = URLEncoder.encode(teamName, StandardCharsets.UTF_8);
            SportsDbTeamSearchResponse response = restClient.get()
                    .uri("/searchteams.php?t={name}", encoded)
                    .retrieve()
                    .body(SportsDbTeamSearchResponse.class);

            if (response == null || response.teams() == null || response.teams().isEmpty()) {
                log.warn("TheSportsDB: khong tim thay doi '{}'", teamName);
                return Optional.empty();
            }
            return Optional.of(response.teams().get(0).idTeam());
        } catch (Exception e) {
            log.error("Loi khi tim team '{}' tren TheSportsDB: {}", teamName, e.getMessage());
            return Optional.empty();
        }
    }

    public List<SportsDbPlayersResponse.SportsDbPlayer> getPlayers(String sportsDbTeamId) {
        try {
            SportsDbPlayersResponse response = restClient.get()
                    .uri("/lookup_all_players.php?id={id}", sportsDbTeamId)
                    .retrieve()
                    .body(SportsDbPlayersResponse.class);

            return response == null || response.player() == null ? List.of() : response.player();
        } catch (Exception e) {
            log.error("Loi khi lay squad cho sportsDbTeamId={}: {}", sportsDbTeamId, e.getMessage());
            return List.of();
        }
    }
}