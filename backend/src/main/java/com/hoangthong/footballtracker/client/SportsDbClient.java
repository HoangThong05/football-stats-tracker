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
 *
 * LUU Y QUAN TRONG: endpoint searchteams.php o goi free BI GIOI HAN
 * chi tra ket qua dung cho tu khoa "Arsenal" (theo docs chinh thuc cua
 * TheSportsDB) -- KHONG dung de search ten doi tu do. Vi vay dung
 * search_all_teams.php (lay theo giai dau) thay the, xem SportsDbTeamMappingService.
 */
@Component
public class SportsDbClient {

    private static final Logger log = LoggerFactory.getLogger(SportsDbClient.class);
    private static final String BASE_URL = "https://www.thesportsdb.com/api/v1/json/3";

    private final RestClient restClient = RestClient.create(BASE_URL);

    /**
     * Lay toan bo doi bong trong 1 giai dau (khong bi gioi han nhu searchteams.php).
     */
    public List<SportsDbTeamSearchResponse.SportsDbTeam> getTeamsInLeague(String leagueName) {
        try {
            String encoded = URLEncoder.encode(leagueName, StandardCharsets.UTF_8);
            SportsDbTeamSearchResponse response = restClient.get()
                    .uri("/search_all_teams.php?l={league}", encoded)
                    .retrieve()
                    .body(SportsDbTeamSearchResponse.class);

            if (response == null || response.teams() == null) {
                log.warn("TheSportsDB: khong lay duoc danh sach doi cho giai '{}'", leagueName);
                return List.of();
            }
            return response.teams();
        } catch (Exception e) {
            log.error("Loi khi lay danh sach doi cua giai '{}' tren TheSportsDB: {}", leagueName, e.getMessage());
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

    /** @deprecated Bi gioi han o goi free, chi dung "Arsenal". Dung getTeamsInLeague() thay the. */
    @Deprecated
    public Optional<String> searchTeamId(String teamName) {
        return Optional.empty();
    }
}