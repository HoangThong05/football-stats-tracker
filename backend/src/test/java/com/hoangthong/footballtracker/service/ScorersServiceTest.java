package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.client.FootballDataClient;
import com.hoangthong.footballtracker.client.dto.ScorersApiResponse;
import com.hoangthong.footballtracker.client.dto.ScorersApiResponse.Player;
import com.hoangthong.footballtracker.client.dto.ScorersApiResponse.Scorer;
import com.hoangthong.footballtracker.client.dto.StandingsApiResponse;
import com.hoangthong.footballtracker.client.dto.StandingsApiResponse.Team;
import com.hoangthong.footballtracker.dto.ScorerDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ScorersServiceTest {

    private FootballDataClient client;
    private ScorersService service;

    @BeforeEach
    void setUp() {
        client = mock(FootballDataClient.class);
        service = new ScorersService(client);
    }

    private static Scorer scorer(long playerId, String name, Integer goals, Integer assists) {
        return new Scorer(
                new Player(playerId, name, "Nuoc X"),
                new Team(5, "Doi Bong", "DB", "DBG", "https://crest/5.png"),
                12, goals, assists, 0);
    }

    @Test
    void danh_so_thu_hang_tang_dan_tu_1() {
        when(client.getScorers("CL")).thenReturn(new ScorersApiResponse(List.of(
                scorer(1, "Mbappe", 15, 1),
                scorer(2, "Kane", 14, 2),
                scorer(3, "Haaland", 8, null)), null));

        List<ScorerDto> result = service.getScorers("CL").scorers();

        assertThat(result).extracting(ScorerDto::rank).containsExactly(1, 2, 3);
        assertThat(result).extracting(ScorerDto::playerName).containsExactly("Mbappe", "Kane", "Haaland");
    }

    @Test
    void assists_null_thi_giu_nguyen_null_khong_doi_thanh_0() {
        when(client.getScorers("CL")).thenReturn(new ScorersApiResponse(List.of(
                scorer(3, "Haaland", 8, null)), null));

        ScorerDto dto = service.getScorers("CL").scorers().get(0);

        assertThat(dto.goals()).isEqualTo(8);
        assertThat(dto.assists()).isNull();
    }

    @Test
    void map_dung_thong_tin_doi_bong() {
        when(client.getScorers("CL")).thenReturn(new ScorersApiResponse(List.of(scorer(1, "Mbappe", 15, 1)), null));

        ScorerDto dto = service.getScorers("CL").scorers().get(0);

        assertThat(dto.playerId()).isEqualTo(1);
        assertThat(dto.teamId()).isEqualTo(5);
        assertThat(dto.teamName()).isEqualTo("Doi Bong");
        assertThat(dto.teamCrest()).isEqualTo("https://crest/5.png");
        assertThat(dto.nationality()).isEqualTo("Nuoc X");
        assertThat(dto.playedMatches()).isEqualTo(12);
    }

    @Test
    void giai_chua_co_vua_pha_luoi_thi_tra_danh_sach_rong() {
        when(client.getScorers("PL")).thenReturn(new ScorersApiResponse(List.of(), null));

        assertThat(service.getScorers("PL").scorers()).isEmpty();
    }

    @Test
    void API_tra_ve_null_thi_khong_nem_NullPointerException() {
        when(client.getScorers("PL")).thenReturn(null);

        assertThat(service.getScorers("PL").scorers()).isEmpty();
    }

    @Test
    void danh_sach_scorers_null_thi_tra_danh_sach_rong() {
        when(client.getScorers("PL")).thenReturn(new ScorersApiResponse(null, null));

        assertThat(service.getScorers("PL").scorers()).isEmpty();
    }

    @Test
    void goi_loi_tu_football_data_thi_tra_danh_sach_rong_khong_nem_ngoai_le() {
        when(client.getScorers("CL")).thenThrow(new org.springframework.web.client.HttpClientErrorException(
                org.springframework.http.HttpStatus.BAD_REQUEST));

        assertThat(service.getScorers("CL").scorers()).isEmpty();
    }

    @Test
    void tinh_dung_nhan_mua_giai_tu_season() {
        StandingsApiResponse.Season season = new StandingsApiResponse.Season("2025-09-01", "2026-05-30", 8);
        when(client.getScorers("CL")).thenReturn(new ScorersApiResponse(List.of(scorer(1, "Mbappe", 15, 1)), season));

        assertThat(service.getScorers("CL").seasonLabel()).isEqualTo("2025/26");
    }
}
