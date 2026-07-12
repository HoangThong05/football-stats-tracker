package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.client.SportsDbClient;
import com.hoangthong.footballtracker.client.dto.SportsDbPlayersResponse.SportsDbPlayer;
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
    private static final int RETRY_INTERVAL_DAYS_ON_FAIL = 1; // map that bai -> thu lai som hon

    private final TeamSquadRepository repository;
    private final SportsDbClient client;
    private final SportsDbTeamMappingService mappingService;

    public TeamSquadService(TeamSquadRepository repository, SportsDbClient client, SportsDbTeamMappingService mappingService) {
        this.repository = repository;
        this.client = client;
        this.mappingService = mappingService;
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
                        p.getNationality()
                ))
                .toList();
    }

    private boolean isStale(TeamSquad cached) {
        int intervalDays = cached.getSportsDbTeamId() == null ? RETRY_INTERVAL_DAYS_ON_FAIL : SYNC_INTERVAL_DAYS;
        return cached.getLastSyncedAt().isBefore(Instant.now().minus(intervalDays, ChronoUnit.DAYS));
    }

    private TeamSquad syncSquad(Long teamId, String teamName, TeamSquad existing) {
        TeamSquad squad = existing != null ? existing : new TeamSquad(teamId);

        String sportsDbTeamId = squad.getSportsDbTeamId();
        if (sportsDbTeamId == null) {
            Optional<String> found = mappingService.findTeamId(teamName);
            if (found.isEmpty()) {
                log.warn("Khong map duoc doi '{}' (id={}) sang TheSportsDB", teamName, teamId);
                squad.setLastSyncedAt(Instant.now());
                return repository.save(squad);
            }
            sportsDbTeamId = found.get();
            squad.setSportsDbTeamId(sportsDbTeamId);
        }

        List<SportsDbPlayer> players = client.getPlayers(sportsDbTeamId);

        List<SquadPlayer> mapped = players.stream()
                .filter(p -> p.strPosition() != null && !p.strPosition().toLowerCase().contains("coach"))
                .map(p -> new SquadPlayer(
                        p.idPlayer(),
                        p.strPlayer(),
                        p.strPosition(),
                        p.strNationality(),
                        p.dateBorn(),
                        p.strThumb()
                ))
                .toList();

        squad.setPlayers(mapped);
        squad.setLastSyncedAt(Instant.now());

        log.info("Da sync {} cau thu cho doi '{}' (id={}) tu TheSportsDB", mapped.size(), teamName, teamId);
        return repository.save(squad);
    }

    private long parseIdSafely(String externalId) {
        try {
            return externalId == null ? 0L : Long.parseLong(externalId);
        } catch (NumberFormatException e) {
            return 0L;
        }
    }
}