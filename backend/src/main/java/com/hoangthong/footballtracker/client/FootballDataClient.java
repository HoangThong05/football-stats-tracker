package com.hoangthong.footballtracker.client;

import com.hoangthong.footballtracker.client.dto.MatchDetailApiResponse;
import com.hoangthong.footballtracker.client.dto.MatchesApiResponse;
import com.hoangthong.footballtracker.client.dto.ScorersApiResponse;
import com.hoangthong.footballtracker.client.dto.StandingsApiResponse;
import com.hoangthong.footballtracker.client.dto.TeamApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.LocalDate;

/**
 * Lop DUY NHAT chiu trach nhiem goi football-data.org.
 * Tach rieng ra de sau nay doi API/nha cung cap chi phai sua o day.
 *
 * Moi phan hoi deu kem header cho biet con bao nhieu request trong phut nay.
 * Khi sap het, football-data.org KHONG bao loi ma GIU CHAM request (~10-15s),
 * nen ta ghi log canh bao de biet truoc.
 */
@Component
public class FootballDataClient {

    private static final Logger log = LoggerFactory.getLogger(FootballDataClient.class);

    /** Header football-data.org tra ve: so request con lai trong phut hien tai. */
    private static final String REMAINING_HEADER = "X-Requests-Available-Minute";

    /** Con <= nguong nay thi canh bao (request tiep theo co the bi lam cham). */
    private static final int LOW_QUOTA_THRESHOLD = 2;

    private final RestClient restClient;

    public FootballDataClient(RestClient footballDataRestClient) {
        this.restClient = footballDataRestClient;
    }

    public StandingsApiResponse getStandings(String competitionCode) {
        return exchange(restClient.get()
                .uri("/competitions/{code}/standings", competitionCode)
                .retrieve()
                .toEntity(StandingsApiResponse.class));
    }

    /**
     * Lay danh sach tran dau trong khoang [dateFrom, dateTo] (dinh dang ISO yyyy-MM-dd).
     * Gioi han theo ngay de payload nho, khong keo ca mua giai ve.
     */
    public MatchesApiResponse getMatches(String competitionCode, LocalDate dateFrom, LocalDate dateTo) {
        return exchange(restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/competitions/{code}/matches")
                        .queryParam("dateFrom", dateFrom.toString())
                        .queryParam("dateTo", dateTo.toString())
                        .build(competitionCode))
                .retrieve()
                .toEntity(MatchesApiResponse.class));
    }

    public MatchDetailApiResponse getMatchDetail(long matchId) {
        return exchange(restClient.get()
                .uri("/matches/{id}", matchId)
                .retrieve()
                .toEntity(MatchDetailApiResponse.class));
    }

    public TeamApiResponse getTeam(long teamId) {
        return exchange(restClient.get()
                .uri("/teams/{id}", teamId)
                .retrieve()
                .toEntity(TeamApiResponse.class));
    }

    public ScorersApiResponse getScorers(String competitionCode) {
        return exchange(restClient.get()
                .uri("/competitions/{code}/scorers", competitionCode)
                .retrieve()
                .toEntity(ScorersApiResponse.class));
    }

    /** Ghi log quota con lai roi tra ve body. */
    private <T> T exchange(ResponseEntity<T> response) {
        logRemainingQuota(response.getHeaders());
        return response.getBody();
    }

    private void logRemainingQuota(HttpHeaders headers) {
        String value = headers.getFirst(REMAINING_HEADER);
        if (value == null) {
            return;
        }
        try {
            int remaining = Integer.parseInt(value.trim());
            if (remaining <= LOW_QUOTA_THRESHOLD) {
                log.warn("Sap het quota football-data.org: con {} request trong phut nay. "
                        + "Vuot qua, API se giu cham cac request tiep theo (~10-15s).", remaining);
            } else {
                log.debug("Quota football-data.org con lai: {} request/phut", remaining);
            }
        } catch (NumberFormatException ex) {
            // Header khong phai so -> bo qua, khong lam hong request chinh.
        }
    }
}
