package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.client.FootballDataClient;
import com.hoangthong.footballtracker.client.dto.TeamApiResponse;
import com.hoangthong.footballtracker.config.CacheConfig;
import com.hoangthong.footballtracker.dto.TeamDetailDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Period;
import java.time.format.DateTimeParseException;
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

        /*
         * football-data.org TRA VE san doi hinh ngay trong chinh request nay (da kiem chung:
         * Arsenal 29 cau thu). Truoc day code bo qua no va di goi API-Football - vua ton them
         * request cua mot dich vu khac, vua la nguyen nhan khien tai khoan do bi khoa.
         *
         * Nguon nay khong co anh va so ao, nhung bu lai co quoc tich; va quan trong nhat la
         * KHONG ton them request nao. Chi khi no rong moi lui ve API-Football.
         */
        List<TeamDetailDto.PlayerDto> squad = mapSquad(response.squad());
        if (squad.isEmpty()) {
            log.info("football-data.org khong co doi hinh cho doi {} -> thu API-Football", teamId);
            squad = squadService.getSquad(teamId, response.name(), response.shortName());
        }

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

    /**
     * Doi cau thu tu football-data.org sang DTO cua ta.
     * Nguon nay khong co anh/so ao (de null), bu lai co quoc tich va ngay sinh.
     */
    private static List<TeamDetailDto.PlayerDto> mapSquad(List<TeamApiResponse.Player> players) {
        if (players == null) return List.of();

        return players.stream()
                .map(p -> new TeamDetailDto.PlayerDto(
                        p.id(),
                        p.name(),
                        p.position(),
                        p.nationality(),
                        null, // khong co anh cau thu
                        null, // khong co so ao
                        ageFrom(p.dateOfBirth())
                ))
                .toList();
    }

    /** Ngay sinh dang "1998-03-21" -> tuoi. Tra null neu thieu/sai dinh dang. */
    private static Integer ageFrom(String dateOfBirth) {
        if (dateOfBirth == null || dateOfBirth.isBlank()) return null;
        try {
            return Period.between(LocalDate.parse(dateOfBirth), LocalDate.now()).getYears();
        } catch (DateTimeParseException ex) {
            return null;
        }
    }
}