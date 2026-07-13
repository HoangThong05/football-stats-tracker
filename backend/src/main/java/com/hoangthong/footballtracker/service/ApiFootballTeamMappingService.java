package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.client.ApiFootballClient;
import com.hoangthong.footballtracker.client.dto.ApiFootballTeamListResponse.TeamWrapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Lay toan bo danh sach doi theo TUNG GIAI qua /teams?league=..&season=..
 * (ten chuan 100% tu chinh API-Football), roi tu match trong code -- thay vi
 * search tung ten rieng le (de truot vi ten viet tat/dau cau khac nhau).
 *
 * Goi free chi cho xem season 2022-2024 (khong cho 2025) -> dung 2024 + 2023
 * de tang do phu (doi moi thang hang co the chua co trong 2024).
 */
@Service
public class ApiFootballTeamMappingService {

    private static final Logger log = LoggerFactory.getLogger(ApiFootballTeamMappingService.class);
    private static final List<Integer> SEASONS = List.of(2024);
    private static final long REFRESH_INTERVAL_HOURS = 24;

    // id giai cua API-Football (khac voi football-data.org)
    private static final List<Integer> LEAGUE_IDS = List.of(
            39,  // Premier League
            140, // La Liga
            78,  // Bundesliga
            135, // Serie A
            61,  // Ligue 1
            2    // Champions League
    );

    private final ApiFootballClient client;

    private volatile Map<String, Long> nameToId = Map.of();
    private volatile Instant lastRefreshed = Instant.EPOCH;

    public ApiFootballTeamMappingService(ApiFootballClient client) {
        this.client = client;
    }

    public synchronized Optional<Long> findTeamId(String teamName) {
        refreshIfNeeded();

        String key = normalize(teamName);

        Long exact = nameToId.get(key);
        if (exact != null) return Optional.of(exact);

        return nameToId.entrySet().stream()
                .filter(e -> e.getKey().contains(key) || key.contains(e.getKey()))
                .map(Map.Entry::getValue)
                .findFirst();
    }

    private void refreshIfNeeded() {
        boolean expired = Duration.between(lastRefreshed, Instant.now()).toHours() >= REFRESH_INTERVAL_HOURS;
        if (!expired && !nameToId.isEmpty()) return;

        Map<String, Long> map = new HashMap<>();
        for (Integer leagueId : LEAGUE_IDS) {
            for (Integer season : SEASONS) {
                List<TeamWrapper> teams = client.getTeamsInLeague(leagueId, season);
                for (TeamWrapper t : teams) {
                    if (t.team() != null && t.team().name() != null) {
                        map.putIfAbsent(normalize(t.team().name()), t.team().id());
                    }
                }
                log.info("Da lay {} doi tu giai id={} season={} tren API-Football", teams.size(), leagueId, season);
            }
        }

        if (!map.isEmpty()) {
            nameToId = map;
            lastRefreshed = Instant.now();
            log.info("Cache mapping API-Football hoan tat: {} doi tong cong", map.size());
        } else {
            log.warn("Khong lay duoc doi nao, giu cache cu ({} doi)", nameToId.size());
        }
    }

    private String normalize(String name) {
        return name.toLowerCase()
                .replaceAll("(?i)\\bfc\\b", "")
                .replaceAll("(?i)\\bcf\\b", "")
                .replaceAll("[^a-z0-9]", "")
                .trim();
    }
}