package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.client.FootballDataClient;
import com.hoangthong.footballtracker.client.dto.ScorersApiResponse;
import com.hoangthong.footballtracker.config.CacheConfig;
import com.hoangthong.footballtracker.dto.ScorerDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

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
    public List<ScorerDto> getScorers(String competitionCode) {
        log.info("CACHE MISS -> goi football-data.org lay vua pha luoi giai: {}", competitionCode);

        ScorersApiResponse response = client.getScorers(competitionCode);
        if (response == null || response.scorers() == null) {
            return List.of();
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
        return result;
    }
}
