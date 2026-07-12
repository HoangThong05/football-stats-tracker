package com.hoangthong.footballtracker.client;

import com.hoangthong.footballtracker.client.dto.ApiFootballSquadResponse;
import com.hoangthong.footballtracker.client.dto.ApiFootballSquadResponse.PlayerInfo;
import com.hoangthong.footballtracker.client.dto.ApiFootballTeamSearchResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Optional;

/**
 * Client goi API-Football (api-sports.io) de lay du lieu cau thu.
 * Ly do dung API nay thay vi TheSportsDB: TheSportsDB gioi han goi free
 * chi hoat dong dung voi du lieu demo co dinh (khong search duoc theo ten
 * that), con API-Football gioi han theo SO LUONG REQUEST/NGAY (100/ngay)
 * nhung moi endpoint hoat dong that 100%.
 */
@Component
public class ApiFootballClient {

    private static final Logger log = LoggerFactory.getLogger(ApiFootballClient.class);
    private static final String BASE_URL = "https://v3.football.api-sports.io";

    private final RestClient restClient;

    public ApiFootballClient(@Value("${api.football.key}") String apiKey) {
        this.restClient = RestClient.builder()
                .baseUrl(BASE_URL)
                .defaultHeader("x-apisports-key", apiKey)
                .build();
    }

    /**
     * Tim id doi bong tren API-Football theo ten (search that, khong bi
     * gioi han demo nhu TheSportsDB).
     */
    public Optional<Long> searchTeamId(String teamName) {
        try {
            ApiFootballTeamSearchResponse response = restClient.get()
                    .uri("/teams?name={name}", teamName)
                    .retrieve()
                    .body(ApiFootballTeamSearchResponse.class);

            if (response == null || response.response() == null || response.response().isEmpty()) {
                log.warn("API-Football: khong tim thay doi '{}'", teamName);
                return Optional.empty();
            }
            return Optional.of(response.response().get(0).team().id());
        } catch (Exception e) {
            log.error("Loi khi tim team '{}' tren API-Football: {}", teamName, e.getMessage());
            return Optional.empty();
        }
    }

    public List<PlayerInfo> getSquad(long teamId) {
        try {
            ApiFootballSquadResponse response = restClient.get()
                    .uri("/players/squads?team={id}", teamId)
                    .retrieve()
                    .body(ApiFootballSquadResponse.class);

            if (response == null || response.response() == null || response.response().isEmpty()) {
                return List.of();
            }
            return response.response().get(0).players();
        } catch (Exception e) {
            log.error("Loi khi lay squad cho teamId={}: {}", teamId, e.getMessage());
            return List.of();
        }
    }
}