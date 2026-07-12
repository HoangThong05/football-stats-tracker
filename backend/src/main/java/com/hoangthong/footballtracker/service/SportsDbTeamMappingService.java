package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.client.SportsDbClient;
import com.hoangthong.footballtracker.client.dto.SportsDbTeamSearchResponse.SportsDbTeam;
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
 * Vi searchteams.php cua TheSportsDB bi gioi han o goi free (chi tra dung
 * cho tu khoa "Arsenal"), ta lay toan bo doi bong theo TUNG GIAI DAU qua
 * search_all_teams.php (khong bi gioi han nay), roi tu match ten trong code.
 *
 * Cache trong memory, refresh moi 24h (khong can goi lai 6 API call lien tuc).
 */
@Service
public class SportsDbTeamMappingService {

    private static final Logger log = LoggerFactory.getLogger(SportsDbTeamMappingService.class);

    // Ten giai dau theo dung cach TheSportsDB dat ten (khac voi ten tren football-data.org)
    private static final List<String> LEAGUES = List.of(
            "English Premier League",
            "Spanish La Liga",
            "Italian Serie A",
            "German Bundesliga",
            "French Ligue 1",
            "UEFA Champions League"
    );

    private static final long REFRESH_INTERVAL_HOURS = 24;

    private final SportsDbClient client;

    // normalized name -> idTeam cua TheSportsDB
    private volatile Map<String, String> nameToId = Map.of();
    private volatile Instant lastRefreshed = Instant.EPOCH;

    public SportsDbTeamMappingService(SportsDbClient client) {
        this.client = client;
    }

    public synchronized Optional<String> findTeamId(String footballDataTeamName) {
        refreshIfNeeded();

        String key = normalize(footballDataTeamName);

        // 1. Thu khop chinh xac truoc
        String exact = nameToId.get(key);
        if (exact != null) {
            return Optional.of(exact);
        }

        // 2. Fallback: khop gan dung (mot ten chua ten kia), phong khi ten khac nhau chut it
        // vi du "Manchester Utd" (football-data) vs "Manchester United" (TheSportsDB)
        return nameToId.entrySet().stream()
                .filter(e -> e.getKey().contains(key) || key.contains(e.getKey()))
                .map(Map.Entry::getValue)
                .findFirst();
    }

    private void refreshIfNeeded() {
        boolean expired = Duration.between(lastRefreshed, Instant.now()).toHours() >= REFRESH_INTERVAL_HOURS;
        if (!expired && !nameToId.isEmpty()) {
            return;
        }

        Map<String, String> map = new HashMap<>();
        for (String league : LEAGUES) {
            List<SportsDbTeam> teams = client.getTeamsInLeague(league);
            for (SportsDbTeam t : teams) {
                if (t.strTeam() != null && t.idTeam() != null) {
                    map.put(normalize(t.strTeam()), t.idTeam());
                }
            }
            log.info("Da lay {} doi tu giai '{}' tren TheSportsDB", teams.size(), league);
        }

        if (!map.isEmpty()) {
            nameToId = map;
            lastRefreshed = Instant.now();
            log.info("Cache mapping TheSportsDB hoan tat: {} doi tong cong", map.size());
        } else {
            log.warn("Khong lay duoc doi nao tu TheSportsDB, giu cache cu ({} doi)", nameToId.size());
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