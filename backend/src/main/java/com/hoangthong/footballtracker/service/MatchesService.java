package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.client.FootballDataClient;
import com.hoangthong.footballtracker.client.dto.MatchesApiResponse;
import com.hoangthong.footballtracker.config.CacheConfig;
import com.hoangthong.footballtracker.dto.MatchDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

@Service
public class MatchesService {

    private static final Logger log = LoggerFactory.getLogger(MatchesService.class);

    /** Cua so ngay: ket qua 14 ngay qua, lich 14 ngay toi. */
    private static final int WINDOW_DAYS = 14;

    // Tran sap dien ra: SCHEDULED (chua co gio chinh thuc) hoac TIMED (da chot gio).
    private static final Set<String> UPCOMING_STATUSES = Set.of("SCHEDULED", "TIMED");

    private final FootballDataClient client;

    public MatchesService(FootballDataClient client) {
        this.client = client;
    }

    /** Lich thi dau: hom nay -> 14 ngay toi, sap xep tran gan nhat len dau. */
    @Cacheable(value = CacheConfig.MATCHES_CACHE, key = "'UPCOMING:' + #competitionCode")
    public List<MatchDto> getUpcoming(String competitionCode) {
        log.info("CACHE MISS -> goi football-data.org lay lich thi dau giai: {}", competitionCode);

        LocalDate today = LocalDate.now();
        MatchesApiResponse response = client.getMatches(competitionCode, today, today.plusDays(WINDOW_DAYS));

        return response.matches().stream()
                .filter(m -> UPCOMING_STATUSES.contains(m.status()))
                .sorted(Comparator.comparing(MatchesApiResponse.Match::utcDate))
                .map(MatchesService::toDto)
                .toList();
    }

    /** Ket qua: 14 ngay qua -> hom nay, tran moi da xong len dau. */
    @Cacheable(value = CacheConfig.MATCHES_CACHE, key = "'RESULTS:' + #competitionCode")
    public List<MatchDto> getResults(String competitionCode) {
        log.info("CACHE MISS -> goi football-data.org lay ket qua giai: {}", competitionCode);

        LocalDate today = LocalDate.now();
        MatchesApiResponse response = client.getMatches(competitionCode, today.minusDays(WINDOW_DAYS), today);

        return response.matches().stream()
                .filter(m -> "FINISHED".equals(m.status()))
                .sorted(Comparator.comparing(MatchesApiResponse.Match::utcDate).reversed())
                .map(MatchesService::toDto)
                .toList();
    }

    private static MatchDto toDto(MatchesApiResponse.Match m) {
        Integer homeScore = null;
        Integer awayScore = null;
        if (m.score() != null && m.score().fullTime() != null) {
            homeScore = m.score().fullTime().home();
            awayScore = m.score().fullTime().away();
        }
        return new MatchDto(
                m.id(),
                m.utcDate(),
                m.status(),
                m.matchday(),
                m.stage(),
                m.homeTeam().name(),
                m.homeTeam().crest(),
                m.awayTeam().name(),
                m.awayTeam().crest(),
                homeScore,
                awayScore
        );
    }
}
