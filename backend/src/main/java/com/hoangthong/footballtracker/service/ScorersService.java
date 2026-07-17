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

import java.util.ArrayList;
import java.util.List;

@Service
public class ScorersService {

    private static final Logger log = LoggerFactory.getLogger(ScorersService.class);

    private final FootballDataClient client;

    public ScorersService(FootballDataClient client) {
        this.client = client;
    }

    @Cacheable(value = CacheConfig.SCORERS_CACHE, key = "#competitionCode")
    public Result getScorers(String competitionCode) {
        log.info("CACHE MISS -> goi football-data.org lay vua pha luoi giai: {}", competitionCode);

        ScorersApiResponse response;
        try {
            response = client.getScorers(competitionCode);
        } catch (RestClientException ex) {
            // Mua giai chua bat dau / chua co du lieu vua pha luoi (thuong gap voi CL dau mua)
            // -> football-data.org tra loi (khong phai 200 rong), coi nhu chua co du lieu.
            log.warn("Khong lay duoc vua pha luoi giai {}: {}", competitionCode, ex.getMessage());
            return new Result(List.of(), null);
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
        boolean anyDataPlayed = result.stream().anyMatch(s -> s.playedMatches() != null && s.playedMatches() > 0);
        return new Result(result, SeasonLabel.of(response.season(), anyDataPlayed));
    }

    /** scorers: du lieu tra ve nguyen JSON body; seasonLabel: gan vao header X-Season-Label (xem ScorersController). */
    public record Result(List<ScorerDto> scorers, String seasonLabel) {
    }
}
