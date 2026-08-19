package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.client.FootballDataClient;
import com.hoangthong.footballtracker.client.dto.TeamApiResponse;
import com.hoangthong.footballtracker.dto.TeamDetailDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TeamServiceTest {

    private FootballDataClient client;
    private TeamSquadService squadService;
    private TeamService service;

    @BeforeEach
    void setUp() {
        client = mock(FootballDataClient.class);
        squadService = mock(TeamSquadService.class);
        // Ghi chi muc cau thu chi la viec phu, khong anh huong ket qua tra ve
        service = new TeamService(client, squadService, mock(PlayerIndexService.class));
    }

    private static TeamApiResponse teamWith(List<TeamApiResponse.Player> squad) {
        return new TeamApiResponse(57, "Arsenal FC", "Arsenal", "ARS", "crest.png",
                1886, "Emirates", "Red / White", "arsenal.com", null, squad);
    }

    private static TeamApiResponse.Player player(long id, String name, String dob) {
        return new TeamApiResponse.Player(id, name, "Midfield", "England", dob);
    }

    /**
     * football-data.org tra ve doi hinh ngay trong request dang goi san (da kiem chung
     * thuc te: Arsenal 29 cau thu). Phai dung luon, TUYET DOI khong goi them API-Football -
     * do la thu da lam tai khoan API-Football bi khoa.
     */
    @Test
    void co_doi_hinh_tu_football_data_thi_dung_luon_khong_goi_API_Football() {
        when(client.getTeam(57)).thenReturn(teamWith(List.of(
                player(1, "Bukayo Saka", "2001-09-05"),
                player(2, "Declan Rice", "1999-01-14"))));

        TeamDetailDto result = service.getTeam(57);

        assertThat(result.squad()).hasSize(2);
        assertThat(result.squad()).extracting(TeamDetailDto.PlayerDto::name)
                .containsExactly("Bukayo Saka", "Declan Rice");
        verify(squadService, never()).getSquad(anyLong(), anyString(), anyString());
    }

    @Test
    void tinh_dung_tuoi_tu_ngay_sinh() {
        String dob = LocalDate.now().minusYears(24).minusDays(10).toString();
        when(client.getTeam(57)).thenReturn(teamWith(List.of(player(1, "X", dob))));

        assertThat(service.getTeam(57).squad().get(0).age()).isEqualTo(24);
    }

    @Test
    void ngay_sinh_hong_hoac_thieu_thi_tuoi_la_null_chu_khong_nem_loi() {
        when(client.getTeam(57)).thenReturn(teamWith(List.of(
                player(1, "X", "khong-phai-ngay"),
                player(2, "Y", null))));

        assertThat(service.getTeam(57).squad()).extracting(TeamDetailDto.PlayerDto::age)
                .containsExactly(null, null);
    }

    @Test
    void giu_lai_quoc_tich_vi_day_la_thu_API_Football_khong_co() {
        when(client.getTeam(57)).thenReturn(teamWith(List.of(player(1, "Saka", "2001-09-05"))));

        assertThat(service.getTeam(57).squad().get(0).nationality()).isEqualTo("England");
    }

    @Test
    void doi_hinh_rong_thi_moi_lui_ve_API_Football() {
        when(client.getTeam(57)).thenReturn(teamWith(List.of()));
        when(squadService.getSquad(anyLong(), anyString(), anyString())).thenReturn(List.of(
                new TeamDetailDto.PlayerDto(9, "Du phong", "Forward", null, "photo.png", 9, 27)));

        TeamDetailDto result = service.getTeam(57);

        assertThat(result.squad()).hasSize(1);
        assertThat(result.squad().get(0).name()).isEqualTo("Du phong");
    }

    @Test
    void squad_null_thi_khong_nem_NullPointerException() {
        when(client.getTeam(57)).thenReturn(teamWith(null));
        when(squadService.getSquad(anyLong(), any(), any())).thenReturn(List.of());

        assertThat(service.getTeam(57).squad()).isEmpty();
    }
}
