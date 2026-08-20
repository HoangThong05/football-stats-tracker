package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.client.FootballDataClient;
import com.hoangthong.footballtracker.client.dto.MatchesApiResponse;
import com.hoangthong.footballtracker.repository.MatchFixtureRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Dong bo day hon cho giai dang co bong lan.
 *
 * Phan phai giu bang moi gia: no KHONG duoc bien thanh "cu 2 phut lai quet ca 6 giai".
 * Han muc football-data.org la 10 request/phut dung chung voi moi trang nguoi dung mo;
 * quet ca 6 giai moi 2 phut la tu bop nghet chinh minh.
 */
class MatchSyncLiveTest {

    private FootballDataClient client;
    private MatchFixtureRepository repository;
    private MatchSyncService service;

    @BeforeEach
    void setUp() {
        client = mock(FootballDataClient.class);
        repository = mock(MatchFixtureRepository.class);
        when(client.getMatches(anyString(), any(), any()))
                .thenReturn(new MatchesApiResponse(List.of()));
        service = new MatchSyncService(client, repository);
    }

    private void dangCoBongLan(String... codes) {
        when(repository.findCompetitionsWithMatchesAround(anyList(), any(), any()))
                .thenReturn(List.of(codes));
    }

    @Test
    void khong_co_tran_nao_thi_khong_goi_API_lan_nao() {
        dangCoBongLan();

        service.syncLiveCompetitions();

        verify(client, never()).getMatches(anyString(), any(), any());
    }

    @Test
    void chi_dong_bo_dung_giai_dang_co_bong_lan() {
        dangCoBongLan("PL");

        service.syncLiveCompetitions();

        verify(client, times(1)).getMatches(eq("PL"), any(), any());
        verify(client, never()).getMatches(eq("PD"), any(), any());
    }

    @Test
    void nhieu_giai_cung_da_thi_van_chan_tran_moi_nhip() {
        dangCoBongLan("PL", "PD", "BL1", "SA", "FL1", "CL");

        service.syncLiveCompetitions();

        // Toi da 3 giai/nhip -> con 7 request cho nguoi dung dang mo trang
        verify(client, times(3)).getMatches(anyString(), any(), any());
    }

    @Test
    void dung_cua_so_ngay_hep_chu_khong_phai_14_ngay_nhu_dong_bo_thuong() {
        dangCoBongLan("PL");
        ArgumentCaptor<LocalDate> from = ArgumentCaptor.forClass(LocalDate.class);
        ArgumentCaptor<LocalDate> to = ArgumentCaptor.forClass(LocalDate.class);

        service.syncLiveCompetitions();

        verify(client).getMatches(eq("PL"), from.capture(), to.capture());
        LocalDate today = LocalDate.now();
        assertThat(from.getValue()).isEqualTo(today.minusDays(1));
        assertThat(to.getValue()).isEqualTo(today.plusDays(1));
    }

    @Test
    void mot_giai_loi_khong_lam_dung_cac_giai_con_lai() {
        dangCoBongLan("PL", "PD");
        when(client.getMatches(eq("PL"), any(), any())).thenThrow(new RuntimeException("429"));

        service.syncLiveCompetitions();

        verify(client, times(1)).getMatches(eq("PD"), any(), any());
    }

    @Test
    void cua_so_tim_giai_phai_lui_ve_qua_khu_de_bat_tran_dang_da_do() {
        dangCoBongLan("PL");
        ArgumentCaptor<Instant> from = ArgumentCaptor.forClass(Instant.class);

        service.syncLiveCompetitions();

        verify(repository).findCompetitionsWithMatchesAround(anyList(), from.capture(), any());
        // Tran bat dau 2 tieng truoc van dang da -> phai nam trong cua so
        assertThat(from.getValue()).isBefore(Instant.now().minusSeconds(2 * 3600));
    }
}
