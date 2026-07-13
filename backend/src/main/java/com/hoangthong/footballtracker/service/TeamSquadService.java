package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.client.ApiFootballClient;
import com.hoangthong.footballtracker.client.dto.ApiFootballSquadResponse.PlayerInfo;
import com.hoangthong.footballtracker.dto.TeamDetailDto;
import com.hoangthong.footballtracker.entity.SquadPlayer;
import com.hoangthong.footballtracker.entity.TeamSquad;
import com.hoangthong.footballtracker.repository.TeamSquadRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
public class TeamSquadService {

    private static final Logger log = LoggerFactory.getLogger(TeamSquadService.class);
    private static final int SYNC_INTERVAL_DAYS = 7;
    private static final int RETRY_INTERVAL_DAYS_ON_FAIL = 1;

    private final TeamSquadRepository repository;
    private final ApiFootballClient client;

    public TeamSquadService(TeamSquadRepository repository, ApiFootballClient client) {
        this.repository = repository;
        this.client = client;
    }

  public List<TeamDetailDto.PlayerDto> getSquad(Long teamId, String teamName) {
    TeamSquad cached = repository.findById(teamId).orElse(null);

    boolean needsSync = cached == null || cached.getLastSyncedAt() == null || isStale(cached);

    if (needsSync) {
        cached = syncSquad(teamId, teamName, cached);
    }

    return cached.getPlayers().stream()
            .map(p -> new TeamDetailDto.PlayerDto(
                    parseIdSafely(p.getExternalId()),
                    p.getName(),
                    p.getPosition(),
                    null,
                    p.getPhotoUrl(),
                    p.getJerseyNumber(),
                    p.getAge()
            ))
            .toList();
}
    private boolean isStale(TeamSquad cached) {
        int intervalDays = cached.getSportsDbTeamId() == null ? RETRY_INTERVAL_DAYS_ON_FAIL : SYNC_INTERVAL_DAYS;
        return cached.getLastSyncedAt().isBefore(Instant.now().minus(intervalDays, ChronoUnit.DAYS));
    }

    private TeamSquad syncSquad(Long teamId, String teamName, TeamSquad existing) {
        TeamSquad squad = existing != null ? existing : new TeamSquad(teamId);

        String apiFootballTeamId = squad.getSportsDbTeamId();
        if (apiFootballTeamId == null) {
            Optional<Long> found = client.searchTeamId(normalizeTeamName(teamName));
            if (found.isEmpty()) {
                log.warn("Khong map duoc doi '{}' (id={}) sang API-Football", teamName, teamId);
                squad.setLastSyncedAt(Instant.now());
                return repository.save(squad);
            }
            apiFootballTeamId = String.valueOf(found.get());
            squad.setSportsDbTeamId(apiFootballTeamId);
        }

        List<PlayerInfo> players = client.getSquad(Long.parseLong(apiFootballTeamId));

List<SquadPlayer> mapped = players.stream()
        .map(p -> new SquadPlayer(
                String.valueOf(p.id()),
                p.name(),
                p.position(),
                p.number(),
                p.age(),
                p.photo()
        ))
        .toList();

        squad.setPlayers(mapped);
        squad.setLastSyncedAt(Instant.now());

        log.info("Da sync {} cau thu cho doi '{}' (id={}) tu API-Football", mapped.size(), teamName, teamId);
        return repository.save(squad);
    }

    /**
     * football-data.org tra ten dang "Real Madrid CF", nhung API-Football
     * luu ten ngan gon hon "Real Madrid" -> bo hau to FC/CF de tang ty le khop.
     */
    private String normalizeTeamName(String name) {
        return name
                .replaceAll("(?i)\\bFC\\b", "")
                .replaceAll("(?i)\\bCF\\b", "")
                .trim();
    }

    private long parseIdSafely(String externalId) {
        try {
            return externalId == null ? 0L : Long.parseLong(externalId);
        } catch (NumberFormatException e) {
            return 0L;
        }
    }
}