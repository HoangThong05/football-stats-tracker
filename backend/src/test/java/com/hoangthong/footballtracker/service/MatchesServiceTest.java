package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.client.FootballDataClient;
import com.hoangthong.footballtracker.client.dto.MatchesApiResponse;
import com.hoangthong.footballtracker.client.dto.MatchesApiResponse.Match;
import com.hoangthong.footballtracker.client.dto.MatchesApiResponse.Score;
import com.hoangthong.footballtracker.client.dto.MatchesApiResponse.ScorePart;
import com.hoangthong.footballtracker.client.dto.StandingsApiResponse.Team;
import com.hoangthong.footballtracker.dto.MatchDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class MatchesServiceTest {

    private FootballDataClient client;
    private MatchesService service;

    @BeforeEach
    void setUp() {
        client = mock(FootballDataClient.class);
        service = new MatchesService(client);
    }

    private static Team team(long id, String name) {
        return new Team(id, name, name, "TLA", "https://crest/" + id + ".png");
    }

    private static Match match(long id, String utcDate, String status, Integer home, Integer away) {
        Score score = new Score(null, new ScorePart(home, away));
        return new Match(id, utcDate, status, 1, "REGULAR_SEASON", team(1, "Chu nha"), team(2, "Khach"), score);
    }

    private void stubMatches(String code, Match... matches) {
        when(client.getMatches(eq(code), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(new MatchesApiResponse(List.of(matches)));
    }

    @Test
    void upcoming_chi_lay_SCHEDULED_va_TIMED_bo_qua_FINISHED() {
        stubMatches("PL",
                match(1, "2026-08-20T14:00:00Z", "SCHEDULED", null, null),
                match(2, "2026-08-21T14:00:00Z", "TIMED", null, null),
                match(3, "2026-08-19T14:00:00Z", "FINISHED", 2, 1));

        List<MatchDto> result = service.getUpcoming("PL");

        assertThat(result).extracting(MatchDto::id).containsExactly(1L, 2L);
    }

    @Test
    void upcoming_sap_xep_tran_gan_nhat_len_dau() {
        stubMatches("PL",
                match(1, "2026-08-25T14:00:00Z", "TIMED", null, null),
                match(2, "2026-08-20T14:00:00Z", "SCHEDULED", null, null),
                match(3, "2026-08-22T14:00:00Z", "TIMED", null, null));

        List<MatchDto> result = service.getUpcoming("PL");

        assertThat(result).extracting(MatchDto::id).containsExactly(2L, 3L, 1L);
    }

    @Test
    void results_chi_lay_FINISHED_va_sap_xep_moi_nhat_len_dau() {
        stubMatches("PL",
                match(1, "2026-05-01T14:00:00Z", "FINISHED", 1, 0),
                match(2, "2026-05-10T14:00:00Z", "FINISHED", 3, 2),
                match(3, "2026-05-20T14:00:00Z", "SCHEDULED", null, null));

        List<MatchDto> result = service.getResults("PL");

        assertThat(result).extracting(MatchDto::id).containsExactly(2L, 1L);
        assertThat(result.get(0).homeScore()).isEqualTo(3);
        assertThat(result.get(0).awayScore()).isEqualTo(2);
    }

    @Test
    void tran_chua_da_thi_ti_so_la_null() {
        stubMatches("PL", match(1, "2026-08-20T14:00:00Z", "SCHEDULED", null, null));

        MatchDto dto = service.getUpcoming("PL").get(0);

        assertThat(dto.homeScore()).isNull();
        assertThat(dto.awayScore()).isNull();
        assertThat(dto.homeTeam()).isEqualTo("Chu nha");
        assertThat(dto.awayTeam()).isEqualTo("Khach");
    }

    @Test
    void score_bang_null_thi_khong_nem_NullPointerException() {
        Match khongCoScore = new Match(9, "2026-08-20T14:00:00Z", "SCHEDULED", 1, "REGULAR_SEASON",
                team(1, "A"), team(2, "B"), null);
        stubMatches("PL", khongCoScore);

        List<MatchDto> result = service.getUpcoming("PL");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).homeScore()).isNull();
    }

    @Test
    void khong_co_tran_nao_thi_tra_danh_sach_rong() {
        stubMatches("PL");

        assertThat(service.getUpcoming("PL")).isEmpty();
        assertThat(service.getResults("PL")).isEmpty();
    }
}
