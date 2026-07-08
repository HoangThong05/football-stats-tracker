package com.hoangthong.footballtracker.client;

import com.hoangthong.footballtracker.client.dto.StandingsApiResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

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
}
