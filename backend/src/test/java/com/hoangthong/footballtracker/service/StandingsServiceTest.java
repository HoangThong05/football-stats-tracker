package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.client.FootballDataClient;
import com.hoangthong.footballtracker.client.dto.StandingsApiResponse;
import com.hoangthong.footballtracker.client.dto.StandingsApiResponse.StandingBlock;
import com.hoangthong.footballtracker.client.dto.StandingsApiResponse.TableEntry;
import com.hoangthong.footballtracker.client.dto.StandingsApiResponse.Team;
import com.hoangthong.footballtracker.dto.StandingRow;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class StandingsServiceTest {

    private FootballDataClient client;
    private StandingsService service;

    @BeforeEach
    void setUp() {
        client = mock(FootballDataClient.class);
        service = new StandingsService(client);
    }

    private static Team team(long id, String name) {
        return new Team(id, name, name, "TLA", "https://crest/" + id + ".png");
    }

    private static TableEntry entry(int position, Team team, int points) {
        // Thu tu: position, team, playedGames, won, draw, lost, points, goalsFor, goalsAgainst, goalDifference
        return new TableEntry(position, team, 10, 6, 2, 2, points, 20, 8, 12);
    }

    @Test
    void map_dung_cac_truong_tu_API_sang_StandingRow() {
        Team arsenal = team(57, "Arsenal FC");
        StandingBlock total = new StandingBlock("LEAGUE", "TOTAL", List.of(entry(1, arsenal, 24)));
        when(client.getStandings("PL", null)).thenReturn(new StandingsApiResponse(null, List.of(total), null));

        List<StandingRow> rows = service.getStandings("PL", null).rows();

        assertThat(rows).hasSize(1);
        StandingRow row = rows.get(0);
        assertThat(row.position()).isEqualTo(1);
        assertThat(row.teamId()).isEqualTo(57);
        assertThat(row.teamName()).isEqualTo("Arsenal FC");
        assertThat(row.crest()).isEqualTo("https://crest/57.png");
        assertThat(row.playedGames()).isEqualTo(10);
        assertThat(row.won()).isEqualTo(6);
        assertThat(row.draw()).isEqualTo(2);
        assertThat(row.lost()).isEqualTo(2);
        assertThat(row.goalsFor()).isEqualTo(20);
        assertThat(row.goalsAgainst()).isEqualTo(8);
        assertThat(row.goalDifference()).isEqualTo(12);
        assertThat(row.points()).isEqualTo(24);
    }

    @Test
    void chi_lay_block_TOTAL_bo_qua_HOME_va_AWAY() {
        Team a = team(1, "Doi A");
        Team b = team(2, "Doi B");
        StandingBlock home = new StandingBlock("LEAGUE", "HOME", List.of(entry(1, b, 99)));
        StandingBlock total = new StandingBlock("LEAGUE", "TOTAL", List.of(entry(1, a, 24)));
        StandingBlock away = new StandingBlock("LEAGUE", "AWAY", List.of(entry(1, b, 88)));

        when(client.getStandings("CL", null)).thenReturn(new StandingsApiResponse(null, List.of(home, total, away), null));

        List<StandingRow> rows = service.getStandings("CL", null).rows();

        assertThat(rows).hasSize(1);
        assertThat(rows.get(0).teamName()).isEqualTo("Doi A");
        assertThat(rows.get(0).points()).isEqualTo(24);
    }

    @Test
    void khong_co_block_TOTAL_thi_nem_ngoai_le() {
        StandingBlock home = new StandingBlock("LEAGUE", "HOME", List.of(entry(1, team(1, "X"), 10)));
        when(client.getStandings("XX", null)).thenReturn(new StandingsApiResponse(null, List.of(home), null));

        assertThatThrownBy(() -> service.getStandings("XX", null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("TOTAL");
    }

    @Test
    void bang_xep_hang_rong_thi_tra_danh_sach_rong() {
        StandingBlock total = new StandingBlock("LEAGUE", "TOTAL", List.of());
        when(client.getStandings("PL", null)).thenReturn(new StandingsApiResponse(null, List.of(total), null));

        assertThat(service.getStandings("PL", null).rows()).isEmpty();
    }

    @Test
    void tinh_dung_nhan_mua_giai_khi_bat_dau_ket_thuc_khac_nam() {
        StandingBlock total = new StandingBlock("LEAGUE", "TOTAL", List.of());
        StandingsApiResponse.Season season = new StandingsApiResponse.Season("2025-08-15", "2026-05-24", 30);
        when(client.getStandings("PL", null)).thenReturn(new StandingsApiResponse(null, List.of(total), season));

        assertThat(service.getStandings("PL", null).seasonLabel()).isEqualTo("2025/26");
    }

    @Test
    void khong_co_season_thi_nhan_mua_giai_la_null() {
        StandingBlock total = new StandingBlock("LEAGUE", "TOTAL", List.of());
        when(client.getStandings("PL", null)).thenReturn(new StandingsApiResponse(null, List.of(total), null));

        assertThat(service.getStandings("PL", null).seasonLabel()).isNull();
    }

    /**
     * Bug thuc te tu football-data.org: object "season" da tro toi mua MOI (startDate
     * o tuong lai, vd nam sau) nhung bang xep hang van la so lieu THAT cua mua VUA XONG
     * (playedGames > 0, du 38 tran). Phai tu phat hien va lui lai 1 nam cho dung.
     */
    @Test
    void season_tro_toi_tuong_lai_nhung_bang_co_du_lieu_that_thi_lui_lai_1_nam() {
        Team barca = team(81, "FC Barcelona");
        StandingBlock total = new StandingBlock("LEAGUE", "TOTAL", List.of(entry(1, barca, 94)));
        StandingsApiResponse.Season futureSeason =
                new StandingsApiResponse.Season("2026-08-16", "2027-05-24", 1);
        when(client.getStandings("PD", null)).thenReturn(new StandingsApiResponse(null, List.of(total), futureSeason));

        assertThat(service.getStandings("PD", null).seasonLabel()).isEqualTo("2025/26");
    }

    @Test
    void chon_mua_tuong_minh_thi_truyen_dung_season_toi_client_va_gan_nhan_chac_chan() {
        Team barca = team(81, "FC Barcelona");
        StandingBlock total = new StandingBlock("LEAGUE", "TOTAL", List.of(entry(1, barca, 94)));
        when(client.getStandings("PD", 2024)).thenReturn(new StandingsApiResponse(null, List.of(total), null));

        StandingsService.Result result = service.getStandings("PD", 2024);

        assertThat(result.rows()).hasSize(1);
        assertThat(result.seasonLabel()).isEqualTo("2024/25");
    }

    @Test
    void chon_mua_tuong_minh_ma_loi_thi_tra_danh_sach_rong_khong_nem_500() {
        when(client.getStandings("PD", 1990))
                .thenThrow(new org.springframework.web.client.HttpClientErrorException(
                        org.springframework.http.HttpStatus.BAD_REQUEST));

        StandingsService.Result result = service.getStandings("PD", 1990);

        assertThat(result.rows()).isEmpty();
        assertThat(result.seasonLabel()).isEqualTo("1990/91");
    }
}
