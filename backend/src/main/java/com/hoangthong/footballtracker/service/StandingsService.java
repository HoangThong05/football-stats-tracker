package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.client.FootballDataClient;
import com.hoangthong.footballtracker.client.dto.StandingsApiResponse;
import com.hoangthong.footballtracker.config.CacheConfig;
import com.hoangthong.footballtracker.dto.StandingRow;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StandingsService {

    private static final Logger log = LoggerFactory.getLogger(StandingsService.class);

    private final FootballDataClient client;

    public StandingsService(FootballDataClient client) {
        this.client = client;
    }

    /**
     * @Cacheable: lan dau goi se chay ham nay va luu ket qua vao cache "standings"
     * theo key la ma giai dau. Cac lan sau (trong 5 phut) se lay tu cache,
     * KHONG goi lai football-data.org.
     */
    @Cacheable(value = CacheConfig.STANDINGS_CACHE, key = "#competitionCode")
    public List<StandingRow> getStandings(String competitionCode) {
        log.info("CACHE MISS -> goi football-data.org cho giai: {}", competitionCode);

        StandingsApiResponse response = client.getStandings(competitionCode);

        // football-data.org tra ve nhieu block (TOTAL / HOME / AWAY). Ta chi lay TOTAL.
        StandingsApiResponse.StandingBlock total = response.standings().stream()
                .filter(block -> "TOTAL".equalsIgnoreCase(block.type()))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException(
                        "Khong tim thay bang xep hang TOTAL cho giai " + competitionCode));

        return total.table().stream()
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
    }
}
