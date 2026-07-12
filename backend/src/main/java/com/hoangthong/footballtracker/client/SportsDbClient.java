package com.hoangthong.footballtracker.client;

import com.hoangthong.footballtracker.client.dto.SportsDbPlayersResponse;
import com.hoangthong.footballtracker.client.dto.SportsDbTeamSearchResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;

/**
 * Client goi TheSportsDB (mien phi) de lay du lieu cau thu.
 *
 * LUU Y QUAN TRONG:
 * - searchteams.php (search theo ten) bi gioi han o goi free, chi tra dung
 *   ket qua cho tu khoa "Arsenal" (theo docs chinh thuc) -- KHONG dung duoc.
 * - search_all_teams.php?l=... (search theo TEN giai dau) co bug da duoc
 *   cong dong bao cao tren forum chinh thuc -- cung KHONG dung duoc.
 * - lookup_all_teams.php?id=... (tra theo ID giai dau) la endpoint on dinh,
 *   dung duoc, vi vay dung endpoint nay thay the.
 */
@Component
public class SportsDbClient {

    private static final Logger log = LoggerFactory.getLogger(SportsDbClient.class);
    private static final String BASE_URL = "https://www.thesportsdb.com/api/v1/json/3";

    private final RestClient restClient = RestClient.create(BASE_URL);

    /**
     * Lay toan bo doi bong trong 1 giai dau bang ID (on dinh, khong bi bug/gioi han
     * nhu search theo ten).
     */
    public List<SportsDbTeamSearchResponse.SportsDbTeam> getTeamsInLeague(String leagueId) {
        try {
            SportsDbTeamSearchResponse response = restClient.get()
                    .uri("/lookup_all_teams.php?id={id}", leagueId)
                    .retrieve()
                    .body(SportsDbTeamSearchResponse.class);

            if (response == null || response.teams() == null) {
                log.warn("TheSportsDB: khong lay duoc danh sach doi cho giai id={}", leagueId);
                return List.of();
            }
            return response.teams();
        } catch (Exception e) {
            log.error("Loi khi lay danh sach doi cua giai id={} tren TheSportsDB: {}", leagueId, e.getMessage());
            return List.of();
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