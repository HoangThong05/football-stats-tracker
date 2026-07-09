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
        when(client.getStandings("PL")).thenReturn(new StandingsApiResponse(null, List.of(total)));

        List<StandingRow> rows = service.getStandings("PL");

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

        when(client.getStandings("CL")).thenReturn(new StandingsApiResponse(null, List.of(home, total, away)));

        List<StandingRow> rows = service.getStandings("CL");

        assertThat(rows).hasSize(1);
        assertThat(rows.get(0).teamName()).isEqualTo("Doi A");
        assertThat(rows.get(0).points()).isEqualTo(24);
    }

    @Test
    void khong_co_block_TOTAL_thi_nem_ngoai_le() {
        StandingBlock home = new StandingBlock("LEAGUE", "HOME", List.of(entry(1, team(1, "X"), 10)));
        when(client.getStandings("XX")).thenReturn(new StandingsApiResponse(null, List.of(home)));

        assertThatThrownBy(() -> service.getStandings("XX"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("TOTAL");
    }

    @Test
    void bang_xep_hang_rong_thi_tra_danh_sach_rong() {
        StandingBlock total = new StandingBlock("LEAGUE", "TOTAL", List.of());
        when(client.getStandings("PL")).thenReturn(new StandingsApiResponse(null, List.of(total)));

        assertThat(service.getStandings("PL")).isEmpty();
    }
}
