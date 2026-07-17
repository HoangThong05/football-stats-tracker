package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.client.FootballDataClient;
import com.hoangthong.footballtracker.client.dto.StandingsApiResponse;
import com.hoangthong.footballtracker.config.CacheConfig;
import com.hoangthong.footballtracker.dto.StandingRow;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;

import java.util.List;

@Service
public class StandingsService {

    private static final Logger log = LoggerFactory.getLogger(StandingsService.class);

    private final FootballDataClient client;

    public StandingsService(FootballDataClient client) {
        this.client = client;
    }

    /**
     * @param season nam bat dau mua giai (vd 2025 = mua 2025/26) - null = "mua hien tai"
     *               (tu chon boi football-data.org, xem SeasonLabel).
     * @Cacheable: lan dau goi se chay ham nay va luu ket qua vao cache "standings"
     * theo key la ma giai dau + mua. Cac lan sau (trong 30 phut) se lay tu cache,
     * KHONG goi lai football-data.org.
     */
    @Cacheable(value = CacheConfig.STANDINGS_CACHE, key = "#competitionCode + ':' + #season")
    public Result getStandings(String competitionCode, Integer season) {
        log.info("CACHE MISS -> goi football-data.org cho giai: {} (season={})", competitionCode, season);

        StandingsApiResponse response;
        try {
            response = client.getStandings(competitionCode, season);
        } catch (RestClientException ex) {
            // Vd chon mua qua cu ma football-data.org khong co du lieu -> coi nhu rong,
            // khong de loi 500 lan ra frontend.
            log.warn("Khong lay duoc bang xep hang giai {} (season={}): {}", competitionCode, season, ex.getMessage());
            return new Result(List.of(), season != null ? SeasonLabel.ofStartYear(season) : null);
        }

        // football-data.org tra ve nhieu block (TOTAL / HOME / AWAY). Ta chi lay TOTAL.
        StandingsApiResponse.StandingBlock total = response.standings().stream()
                .filter(block -> "TOTAL".equalsIgnoreCase(block.type()))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException(
                        "Khong tim thay bang xep hang TOTAL cho giai " + competitionCode));

        List<StandingRow> rows = total.table().stream()
                .map(e -> new StandingRow(
                        e.position(),
                        e.team().id(),
                        e.team().name(),
                        e.team().crest(),
                        e.playedGames(),
                        e.won(),
                        e.draw(),
                        e.lost(),
                        e.goalsFor(),
                        e.goalsAgainst(),
                        e.goalDifference(),
                        e.points()
                ))
                .toList();

        String seasonLabel;
        if (season != null) {
            // Nguoi dung da chon mua tuong minh -> biet chac chan, khong can doan.
            seasonLabel = SeasonLabel.ofStartYear(season);
        } else {
            boolean anyDataPlayed = rows.stream().anyMatch(r -> r.playedGames() > 0);
            seasonLabel = SeasonLabel.of(response.season(), anyDataPlayed);
        }
        return new Result(rows, seasonLabel);
    }

    /** rows: du lieu tra ve nguyen JSON body; seasonLabel: gan vao header X-Season-Label (xem StandingsController). */
    public record Result(List<StandingRow> rows, String seasonLabel) {
    }
}
