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
import org.springframework.http.HttpStatus;
import org.springframework.web.client.HttpClientErrorException;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
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
        when(client.getScorers("CL", null)).thenReturn(new ScorersApiResponse(List.of(
                scorer(1, "Mbappe", 15, 1),
                scorer(2, "Kane", 14, 2),
                scorer(3, "Haaland", 8, null)), null));

        List<ScorerDto> result = service.getScorers("CL", null).scorers();

        assertThat(result).extracting(ScorerDto::rank).containsExactly(1, 2, 3);
        assertThat(result).extracting(ScorerDto::playerName).containsExactly("Mbappe", "Kane", "Haaland");
    }

    @Test
    void assists_null_thi_giu_nguyen_null_khong_doi_thanh_0() {
        when(client.getScorers("CL", null)).thenReturn(new ScorersApiResponse(List.of(
                scorer(3, "Haaland", 8, null)), null));

        ScorerDto dto = service.getScorers("CL", null).scorers().get(0);

        assertThat(dto.goals()).isEqualTo(8);
        assertThat(dto.assists()).isNull();
    }

    @Test
    void map_dung_thong_tin_doi_bong() {
        when(client.getScorers("CL", null)).thenReturn(new ScorersApiResponse(List.of(scorer(1, "Mbappe", 15, 1)), null));

        ScorerDto dto = service.getScorers("CL", null).scorers().get(0);

        assertThat(dto.playerId()).isEqualTo(1);
        assertThat(dto.teamId()).isEqualTo(5);
        assertThat(dto.teamName()).isEqualTo("Doi Bong");
        assertThat(dto.teamCrest()).isEqualTo("https://crest/5.png");
        assertThat(dto.nationality()).isEqualTo("Nuoc X");
        assertThat(dto.playedMatches()).isEqualTo(12);
    }

    @Test
    void giai_chua_co_vua_pha_luoi_thi_tra_danh_sach_rong() {
        when(client.getScorers("PL", null)).thenReturn(new ScorersApiResponse(List.of(), null));

        assertThat(service.getScorers("PL", null).scorers()).isEmpty();
    }

    @Test
    void API_tra_ve_null_thi_khong_nem_NullPointerException() {
        when(client.getScorers("PL", null)).thenReturn(null);

        assertThat(service.getScorers("PL", null).scorers()).isEmpty();
    }

    @Test
    void danh_sach_scorers_null_thi_tra_danh_sach_rong() {
        when(client.getScorers("PL", null)).thenReturn(new ScorersApiResponse(null, null));

        assertThat(service.getScorers("PL", null).scorers()).isEmpty();
    }

    @Test
    void goi_loi_ca_2_lan_thi_tra_danh_sach_rong_khong_nem_ngoai_le() {
        when(client.getScorers(eq("CL"), isNull())).thenThrow(new HttpClientErrorException(HttpStatus.BAD_REQUEST));
        when(client.getScorers(eq("CL"), anyInt())).thenThrow(new HttpClientErrorException(HttpStatus.BAD_REQUEST));

        assertThat(service.getScorers("CL", null).scorers()).isEmpty();
    }

    @Test
    void tinh_dung_nhan_mua_giai_tu_season() {
        StandingsApiResponse.Season season = new StandingsApiResponse.Season("2025-09-01", "2026-05-30", 8);
        when(client.getScorers("CL", null)).thenReturn(new ScorersApiResponse(List.of(scorer(1, "Mbappe", 15, 1)), season));

        assertThat(service.getScorers("CL", null).seasonLabel()).isEqualTo("2025/26");
    }

    /**
     * Bug thuc te: football-data.org tu tro "mua hien tai" toi mua CHUA co du lieu vua pha
     * luoi (loi 400) trong khi Bang xep hang van con giu du lieu mua truoc. Phai tu goi lai
     * co chi dinh tuong minh "season" (nam bat dau mua giai gan nhat theo lich chau Au) de
     * lay duoc du lieu that thay vi bo cuoc va hien rong.
     */
    @Test
    void goi_khong_season_bi_loi_thi_tu_goi_lai_co_chi_dinh_season_gan_nhat() {
        int expectedYear = SeasonLabel.likelyCurrentSeasonStartYear(LocalDate.now());
        when(client.getScorers(eq("PD"), isNull())).thenThrow(new HttpClientErrorException(HttpStatus.BAD_REQUEST));
        when(client.getScorers(eq("PD"), eq(expectedYear)))
                .thenReturn(new ScorersApiResponse(List.of(scorer(1, "Mbappe", 15, 1)), null));

        ScorersService.Result result = service.getScorers("PD", null);

        assertThat(result.scorers()).hasSize(1);
        assertThat(result.seasonLabel()).isEqualTo(SeasonLabel.ofStartYear(expectedYear));
    }

    @Test
    void chon_mua_tuong_minh_thi_truyen_dung_toi_client_khong_can_thu_lai() {
        when(client.getScorers("CL", 2023))
                .thenReturn(new ScorersApiResponse(List.of(scorer(1, "Mbappe", 15, 1)), null));

        ScorersService.Result result = service.getScorers("CL", 2023);

        assertThat(result.scorers()).hasSize(1);
        assertThat(result.seasonLabel()).isEqualTo("2023/24");
    }

    @Test
    void chon_mua_tuong_minh_ma_loi_thi_tra_rong_khong_thu_lai_mua_khac() {
        when(client.getScorers("CL", 1990))
                .thenThrow(new HttpClientErrorException(HttpStatus.BAD_REQUEST));

        ScorersService.Result result = service.getScorers("CL", 1990);

        assertThat(result.scorers()).isEmpty();
        assertThat(result.seasonLabel()).isEqualTo("1990/91");
    }
}
