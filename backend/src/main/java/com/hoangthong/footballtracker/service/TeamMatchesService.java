package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.dto.DayMatchDto;
import com.hoangthong.footballtracker.entity.MatchFixture;
import com.hoangthong.footballtracker.repository.MatchFixtureRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Tran da xong va tran sap da cua MOT doi, cho trang chi tiet doi bong.
 *
 * Doc thang tu database (MatchSyncService dong bo san) nen KHONG ton request nao cua
 * football-data.org - trang doi bong von da ton 1 request cho phan thong tin doi roi.
 */
@Service
public class TeamMatchesService {

    /*
     * Nam tran gan nhat va nam tran sap toi.
     *
     * Lay nhieu hon thi trang dai ra ma phan duoi gan nhu khong ai keo xuong doc; ai muon
     * xem day du da co tab "Ket qua" va "Lich thi dau" cua ca giai.
     */
    private static final int LIMIT = 5;

    private final MatchFixtureRepository repository;

    public TeamMatchesService(MatchFixtureRepository repository) {
        this.repository = repository;
    }

    public Result forTeam(long teamId) {
        var page = PageRequest.of(0, LIMIT);
        return new Result(
                repository.findFinishedByTeam(teamId, page).stream().map(TeamMatchesService::toDto).toList(),
                repository.findUpcomingByTeam(teamId, page).stream().map(TeamMatchesService::toDto).toList());
    }

    public record Result(List<DayMatchDto> recent, List<DayMatchDto> upcoming) {}

    private static DayMatchDto toDto(MatchFixture m) {
        return new DayMatchDto(
                m.getId(),
                m.getCompetition(),
                m.getUtcDate().toString(),
                m.getStatus(),
                m.getMatchday(),
                m.getHomeTeamId(),
                m.getHomeTeam(),
                m.getHomeCrest(),
                m.getAwayTeamId(),
                m.getAwayTeam(),
                m.getAwayCrest(),
                m.getHomeScore(),
                m.getAwayScore());
    }
}
