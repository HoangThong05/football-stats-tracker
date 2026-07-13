package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.client.FootballDataClient;
import com.hoangthong.footballtracker.client.dto.TeamApiResponse;
import com.hoangthong.footballtracker.config.CacheConfig;
import com.hoangthong.footballtracker.dto.TeamDetailDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TeamService {

    private static final Logger log = LoggerFactory.getLogger(TeamService.class);

    private final FootballDataClient client;
    private final TeamSquadService squadService;

    public TeamService(FootballDataClient client, TeamSquadService squadService) {
        this.client = client;
        this.squadService = squadService;
    }

    @Cacheable(value = CacheConfig.TEAMS_CACHE, key = "#teamId")
    public TeamDetailDto getTeam(long teamId) {
        log.info("CACHE MISS -> goi football-data.org cho doi bong id: {}", teamId);

        TeamApiResponse response = client.getTeam(teamId);
        String coachName = response.coach() != null ? response.coach().name() : null;

        // football-data.org free tier khong tra squad -> fallback sang API-Football.
        // Truyen them shortName vi mot so doi (Newcastle, PSG, Atletico Madrid...)
        // chi khop duoc voi ten ngan gon, khong khop voi ten day du.
        List<TeamDetailDto.PlayerDto> squad = squadService.getSquad(teamId, response.name(), response.shortName());

        return new TeamDetailDto(
                response.id(),
                response.name(),
                response.crest(),
                response.founded(),
                response.venue(),
                response.clubColors(),
                response.website(),
                coachName,
                squad
        );
    }
}