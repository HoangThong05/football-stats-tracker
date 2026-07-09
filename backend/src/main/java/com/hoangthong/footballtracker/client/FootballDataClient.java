package com.hoangthong.footballtracker.client;

import com.hoangthong.footballtracker.client.dto.MatchesApiResponse;
import com.hoangthong.footballtracker.client.dto.ScorersApiResponse;
import com.hoangthong.footballtracker.client.dto.StandingsApiResponse;
import com.hoangthong.footballtracker.client.dto.TeamApiResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.LocalDate;

/**
 * Lop DUY NHAT chiu trach nhiem goi football-data.org.
 * Tach rieng ra de sau nay doi API/nha cung cap chi phai sua o day.
 */
@Component
public class FootballDataClient {

    private final RestClient restClient;

    public FootballDataClient(RestClient footballDataRestClient) {
        this.restClient = footballDataRestClient;
    }

    public StandingsApiResponse getStandings(String competitionCode) {
        return restClient.get()
                .uri("/competitions/{code}/standings", competitionCode)
                .retrieve()
                .body(StandingsApiResponse.class);
    }

    /**
     * Lay danh sach tran dau trong khoang [dateFrom, dateTo] (dinh dang ISO yyyy-MM-dd).
     * Gioi han theo ngay de payload nho, khong keo ca mua giai ve.
     */
    public MatchesApiResponse getMatches(String competitionCode, LocalDate dateFrom, LocalDate dateTo) {
        return restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/competitions/{code}/matches")
                        .queryParam("dateFrom", dateFrom.toString())
                        .queryParam("dateTo", dateTo.toString())
                        .build(competitionCode))
                .retrieve()
                .body(MatchesApiResponse.class);
    }

    public TeamApiResponse getTeam(long teamId) {
        return restClient.get()
                .uri("/teams/{id}", teamId)
                .retrieve()
                .body(TeamApiResponse.class);
    }

    public ScorersApiResponse getScorers(String competitionCode) {
        return restClient.get()
                .uri("/competitions/{code}/scorers", competitionCode)
                .retrieve()
                .body(ScorersApiResponse.class);
    }
}
