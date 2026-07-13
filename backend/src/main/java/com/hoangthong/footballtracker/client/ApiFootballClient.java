package com.hoangthong.footballtracker.client;

import com.hoangthong.footballtracker.client.dto.ApiFootballSquadResponse;
import com.hoangthong.footballtracker.client.dto.ApiFootballSquadResponse.PlayerInfo;
import com.hoangthong.footballtracker.client.dto.ApiFootballTeamListResponse;
import com.hoangthong.footballtracker.client.dto.ApiFootballTeamSearchResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Optional;

/**
 * Client goi API-Football (api-sports.io) de lay du lieu cau thu.
 *
 * LUU Y QUAN TRONG:
 * - Goi free KHONG duoc xem /teams?league=..&season=.. cho mua giai hien tai
 *   (2025), chi duoc phep voi mua 2022-2024. Vi vay dung mua cu de lay
 *   TEN + ID doi (thong tin nay it doi qua cac mua), squad thuc te van luon
 *   lay tu endpoint players/squads (khong can season, luon la doi hinh hien tai).
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

    /** @deprecated Ten day du/ngan tu football-data.org khong luon khop voi ten
     * luu tren API-Football (vd "Newcastle United FC" vs "Newcastle") -> dung
     * getTeamsInLeague() de lay ten chuan truc tiep tu API-Football thay the. */
    @Deprecated
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
        } catch (HttpClientErrorException.TooManyRequests e) {
            log.warn("API-Football: bi rate limit (429) khi tim doi '{}', se thu lai o lan sync sau", teamName);
            return Optional.empty();
        } catch (Exception e) {
            log.error("Loi khi tim team '{}' tren API-Football: {}", teamName, e.getMessage());
            return Optional.empty();
        }
    }

    public List<ApiFootballTeamListResponse.TeamWrapper> getTeamsInLeague(int leagueId, int season) {
        try {
            ApiFootballTeamListResponse response = restClient.get()
                    .uri("/teams?league={league}&season={season}", leagueId, season)
                    .retrieve()
                    .body(ApiFootballTeamListResponse.class);

            return response == null || response.response() == null ? List.of() : response.response();
        } catch (HttpClientErrorException.TooManyRequests e) {
            log.warn("API-Football: bi rate limit (429) khi lay doi cua giai id={} season={}", leagueId, season);
            return List.of();
        } catch (Exception e) {
            log.error("Loi khi lay danh sach doi cua giai id={} season={} tren API-Football: {}", leagueId, season, e.getMessage());
            return List.of();
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
        } catch (HttpClientErrorException.TooManyRequests e) {
            log.warn("API-Football: bi rate limit (429) khi lay squad cho teamId={}", teamId);
            return List.of();
        } catch (Exception e) {
            log.error("Loi khi lay squad cho teamId={}: {}", teamId, e.getMessage());
            return List.of();
        }
    }
}