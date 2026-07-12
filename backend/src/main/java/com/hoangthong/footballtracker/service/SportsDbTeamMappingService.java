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
 * Vi search theo ten (searchteams.php / search_all_teams.php?l=) deu bi
 * gioi han hoac co bug o goi free cua TheSportsDB, ta lay toan bo doi bong
 * theo ID GIAI DAU qua lookup_all_teams.php (on dinh), roi tu match ten
 * trong code.
 *
 * Cache trong memory, refresh moi 24h.
 */
@Service
public class SportsDbTeamMappingService {

    private static final Logger log = LoggerFactory.getLogger(SportsDbTeamMappingService.class);

    // idLeague cua TheSportsDB (KHONG phai id cua football-data.org)
    private static final List<String> LEAGUE_IDS = List.of(
            "4328", // English Premier League
            "4335", // Spanish La Liga
            "4332", // Italian Serie A
            "4331", // German Bundesliga
            "4334", // French Ligue 1
            "4480"  // UEFA Champions League
    );

    private static final long REFRESH_INTERVAL_HOURS = 24;

    private final SportsDbClient client;

    private volatile Map<String, String> nameToId = Map.of();
    private volatile Instant lastRefreshed = Instant.EPOCH;

    public SportsDbTeamMappingService(SportsDbClient client) {
        this.client = client;
    }

    public synchronized Optional<String> findTeamId(String footballDataTeamName) {
        refreshIfNeeded();

        String key = normalize(footballDataTeamName);

        String exact = nameToId.get(key);
        if (exact != null) {
            return Optional.of(exact);
        }

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
        for (String leagueId : LEAGUE_IDS) {
            List<SportsDbTeam> teams = client.getTeamsInLeague(leagueId);
            for (SportsDbTeam t : teams) {
                if (t.strTeam() != null && t.idTeam() != null) {
                    map.put(normalize(t.strTeam()), t.idTeam());
                }
            }
            log.info("Da lay {} doi tu giai id={} tren TheSportsDB", teams.size(), leagueId);
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