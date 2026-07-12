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

    private final TeamSquadRepository repository;
    private final SportsDbClient client;

    public TeamSquadService(TeamSquadRepository repository, SportsDbClient client) {
        this.repository = repository;
        this.client = client;
    }

  public List<TeamDetailDto.PlayerDto> getSquad(Long teamId, String teamName) {
    TeamSquad cached = repository.findById(teamId).orElse(null);

    boolean needsSync = cached == null
            || cached.getLastSyncedAt() == null
            || cached.getLastSyncedAt().isBefore(Instant.now().minus(SYNC_INTERVAL_DAYS, ChronoUnit.DAYS));

    if (needsSync) {
        cached = syncSquad(teamId, teamName, cached);
    }

    return cached.getPlayers().stream()
            .map(p -> new TeamDetailDto.PlayerDto(0L, p.getName(), p.getPosition(), p.getNationality()))
            .toList();
}

    private TeamSquad syncSquad(Long teamId, String teamName, TeamSquad existing) {
        TeamSquad squad = existing != null ? existing : new TeamSquad(teamId);

        String sportsDbTeamId = squad.getSportsDbTeamId();
        if (sportsDbTeamId == null) {
            Optional<String> found = client.searchTeamId(normalizeTeamName(teamName));
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
                .map(p -> new SquadPlayer(
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

    private String normalizeTeamName(String name) {
        return name
                .replaceAll("(?i)\\bFC\\b", "")
                .replaceAll("(?i)\\bCF\\b", "")
                .trim();
    }
}