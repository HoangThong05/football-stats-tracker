package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.dto.DayMatchDto;
import com.hoangthong.footballtracker.entity.MatchFixture;
import com.hoangthong.footballtracker.repository.MatchFixtureRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Tran dau cua MOI giai trong 1 khoang thoi gian (trang "Hom nay").
 *
 * Doc THANG tu bang match_fixture - noi MatchSyncService da dong bo san ca 6 giai
 * moi 30 phut - nen KHONG ton request nao toi football-data.org (tranh cham
 * gioi han 10 request/phut cua goi mien phi).
 *
 * Danh doi: ti so tre toi da bang chu ky dong bo (mac dinh 30 phut), khong phai
 * truc tiep tung phut. Ngoai ra chi co du lieu trong cua so MatchSyncService
 * dong bo (hien tai: 2 ngay truoc -> 14 ngay toi).
 */
@Service
public class DayMatchesService {

    /** Chan khoang qua rong de 1 request khong keo ca nghin dong tu DB. */
    private static final Duration MAX_RANGE = Duration.ofDays(7);

    private final MatchFixtureRepository repository;

    public DayMatchesService(MatchFixtureRepository repository) {
        this.repository = repository;
    }

    public List<DayMatchDto> getMatchesBetween(Instant from, Instant to) {
        if (from == null || to == null || !from.isBefore(to)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Khoang thoi gian khong hop le");
        }
        if (Duration.between(from, to).compareTo(MAX_RANGE) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Khoang thoi gian toi da la 7 ngay");
        }

        return repository.findByUtcDateBetweenOrderByUtcDateAsc(from, to).stream()
                .map(DayMatchesService::toDto)
                .toList();
    }

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
                m.getAwayScore()
        );
    }
}
