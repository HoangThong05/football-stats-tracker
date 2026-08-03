package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.client.FootballDataClient;
import com.hoangthong.footballtracker.client.dto.ScorersApiResponse;
import com.hoangthong.footballtracker.config.CacheConfig;
import com.hoangthong.footballtracker.dto.ScorerDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class ScorersService {

    private static final Logger log = LoggerFactory.getLogger(ScorersService.class);

    private final FootballDataClient client;

    public ScorersService(FootballDataClient client) {
        this.client = client;
    }

    /**
     * @param requestedSeason nam bat dau mua giai nguoi dung chon tuong minh (vd 2024 = mua
     *                        2024/25), null = "mua hien tai" (tu dong, co retry - xem duoi).
     */
    @Cacheable(value = CacheConfig.SCORERS_CACHE, key = "#competitionCode + ':' + #requestedSeason")
    public Result getScorers(String competitionCode, Integer requestedSeason) {
        log.info("CACHE MISS -> goi football-data.org lay vua pha luoi giai: {} (season={})",
                competitionCode, requestedSeason);

        ScorersApiResponse response;
        Integer fallbackSeasonYear = null;
        try {
            response = client.getScorers(competitionCode, requestedSeason);
        } catch (RestClientException ex) {
            if (requestedSeason != null) {
                // Nguoi dung da chon mua cu the (vd qua cu, khong co du lieu) -> coi nhu rong.
                log.warn("Khong lay duoc vua pha luoi giai {} cho season={}: {}",
                        competitionCode, requestedSeason, ex.getMessage());
                return new Result(List.of(), SeasonLabel.ofStartYear(requestedSeason));
            }
            log.warn("Loi khi lay vua pha luoi giai {} (mua tu dong): {}", competitionCode, ex.getMessage());
            response = null;
        }

        /*
         * "Mua hien tai" tu dong cua football-data.org co the tro toi mua CHUA co du lieu
         * vua pha luoi. Khi do ho tra ve 1 trong 2 kieu: nem loi, HOAC 200 kem danh sach RONG.
         * Ca hai deu phai thu lai, neu khong se xay ra canh Bang xep hang hien mua 2025/26
         * con Vua pha luoi lai hien mua 2026/27 rong tuech - cung 1 giai ma lech mua.
         */
        boolean emptyAuto = requestedSeason == null
                && (response == null || response.scorers() == null || response.scorers().isEmpty());
        if (emptyAuto) {
            fallbackSeasonYear = SeasonLabel.likelyCurrentSeasonStartYear(LocalDate.now());
            log.info("Vua pha luoi giai {} rong o mua tu dong -> thu lai voi season={}",
                    competitionCode, fallbackSeasonYear);
            try {
                response = client.getScorers(competitionCode, fallbackSeasonYear);
            } catch (RestClientException ex2) {
                log.warn("Van khong lay duoc vua pha luoi giai {} du da chi dinh season={}: {}",
                        competitionCode, fallbackSeasonYear, ex2.getMessage());
                return new Result(List.of(), null);
            }
        }

        if (response == null || response.scorers() == null) {
            return new Result(List.of(), null);
        }

        List<ScorerDto> result = new ArrayList<>();
        int rank = 1;
        for (ScorersApiResponse.Scorer s : response.scorers()) {
            result.add(new ScorerDto(
                    rank++,
                    s.player().id(),
                    s.player().name(),
                    s.player().nationality(),
                    s.team().id(),
                    s.team().name(),
                    s.team().crest(),
                    s.playedMatches(),
                    s.goals(),
                    s.assists()
            ));
        }

        String seasonLabel;
        if (requestedSeason != null) {
            seasonLabel = SeasonLabel.ofStartYear(requestedSeason);
        } else if (fallbackSeasonYear != null) {
            seasonLabel = SeasonLabel.ofStartYear(fallbackSeasonYear);
        } else {
            boolean anyDataPlayed = result.stream().anyMatch(s -> s.playedMatches() != null && s.playedMatches() > 0);
            seasonLabel = SeasonLabel.of(response.season(), anyDataPlayed);
        }
        return new Result(result, seasonLabel);
    }

    /** scorers: du lieu tra ve nguyen JSON body; seasonLabel: gan vao header X-Season-Label (xem ScorersController). */
    public record Result(List<ScorerDto> scorers, String seasonLabel) {
    }
}
