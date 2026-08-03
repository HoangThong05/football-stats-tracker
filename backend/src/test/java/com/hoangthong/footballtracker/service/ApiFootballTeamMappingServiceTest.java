package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.client.ApiFootballClient;
import com.hoangthong.footballtracker.client.dto.ApiFootballTeamListResponse.TeamInfo;
import com.hoangthong.footballtracker.client.dto.ApiFootballTeamListResponse.TeamWrapper;
import com.hoangthong.footballtracker.entity.ApiFootballSyncState;
import com.hoangthong.footballtracker.entity.ApiFootballTeamMap;
import com.hoangthong.footballtracker.repository.ApiFootballSyncStateRepository;
import com.hoangthong.footballtracker.repository.ApiFootballTeamMapRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ApiFootballTeamMappingServiceTest {

    private ApiFootballClient client;
    private ApiFootballTeamMapRepository repository;
    private ApiFootballSyncStateRepository syncStateRepository;
    private ApiFootballTeamMappingService service;

    @BeforeEach
    void setUp() {
        client = mock(ApiFootballClient.class);
        repository = mock(ApiFootballTeamMapRepository.class);
        syncStateRepository = mock(ApiFootballSyncStateRepository.class);
        // Mac dinh: chua tung goi API lan nao -> khong bi chan boi thoi gian cho
        when(syncStateRepository.findById(ApiFootballSyncState.SINGLETON_ID)).thenReturn(Optional.empty());
        service = new ApiFootballTeamMappingService(client, repository, syncStateRepository);
    }

    /** Gia lap: lan thu gan nhat cach day `hoursAgo` gio. */
    private void lastAttempt(long hoursAgo) {
        when(syncStateRepository.findById(ApiFootballSyncState.SINGLETON_ID))
                .thenReturn(Optional.of(new ApiFootballSyncState(Instant.now().minus(hoursAgo, ChronoUnit.HOURS))));
    }

    private static TeamWrapper team(long id, String name) {
        return new TeamWrapper(new TeamInfo(id, name));
    }

    private static ApiFootballTeamMap row(String normalizedName, long id) {
        return new ApiFootballTeamMap(normalizedName, id);
    }

    /**
     * Diem quan trong nhat: co du lieu trong DB thi TUYET DOI khong duoc goi API-Football.
     * Truoc day bang map chi nam o RAM nen moi lan app ngu day la ban 6 request -
     * chinh la thu lam dot quota va khien tai khoan bi khoa.
     */
    @Test
    void co_du_lieu_trong_DB_va_con_moi_thi_khong_goi_API() {
        when(repository.findAll()).thenReturn(List.of(row("arsenal", 42L)));
        when(repository.findLastUpdatedAt()).thenReturn(Optional.of(Instant.now()));

        Optional<Long> id = service.findTeamId("Arsenal FC");

        assertThat(id).contains(42L);
        verify(client, never()).getTeamsInLeague(anyInt(), anyInt());
    }

    @Test
    void DB_trong_thi_goi_API_va_luu_ket_qua_xuong_DB() {
        when(repository.findAll()).thenReturn(List.of());
        when(repository.findLastUpdatedAt()).thenReturn(Optional.empty());
        when(repository.findById(anyString())).thenReturn(Optional.empty());
        when(client.getTeamsInLeague(anyInt(), anyInt())).thenReturn(List.of(team(42L, "Arsenal")));

        Optional<Long> id = service.findTeamId("Arsenal FC");

        assertThat(id).contains(42L);
        verify(repository).saveAll(org.mockito.ArgumentMatchers.anyList());
    }

    @Test
    void DB_qua_cu_thi_lay_lai_tu_API() {
        when(repository.findAll()).thenReturn(List.of(row("arsenal", 1L)));
        when(repository.findLastUpdatedAt())
                .thenReturn(Optional.of(Instant.now().minus(60, ChronoUnit.DAYS)));
        when(repository.findById(anyString())).thenReturn(Optional.empty());
        when(client.getTeamsInLeague(anyInt(), anyInt())).thenReturn(List.of(team(42L, "Arsenal")));

        assertThat(service.findTeamId("Arsenal FC")).contains(42L);
    }

    /**
     * Tai khoan API-Football bi khoa/het quota -> moi request tra ve rong.
     * Khi do phai GIU nguyen ban map cu, khong duoc xoa trang, neu khong se mat luon
     * kha nang tra cuu cac doi da tung map duoc.
     */
    @Test
    void API_tra_rong_thi_giu_nguyen_ban_map_cu_khong_xoa_trang() {
        when(repository.findAll()).thenReturn(List.of(row("arsenal", 42L)));
        when(repository.findLastUpdatedAt())
                .thenReturn(Optional.of(Instant.now().minus(60, ChronoUnit.DAYS)));
        when(client.getTeamsInLeague(anyInt(), anyInt())).thenReturn(List.of());

        Optional<Long> id = service.findTeamId("Arsenal FC");

        assertThat(id).contains(42L); // van tra cuu duoc nho du lieu cu
        verify(repository, never()).saveAll(org.mockito.ArgumentMatchers.anyList());
    }

    /**
     * LOI NGHIEM TRONG DA TUNG CO: khi DB rong va API luon that bai (tai khoan bi khoa),
     * moi lan co nguoi mo trang chi tiet doi lai ban them 6 request -> tu dot quota.
     * Sau khi vua thu that bai, phai IM LANG trong vai gio.
     */
    @Test
    void vua_thu_that_bai_thi_khong_duoc_goi_lai_API() {
        when(repository.findAll()).thenReturn(List.of());
        when(repository.findLastUpdatedAt()).thenReturn(Optional.empty());
        lastAttempt(1); // moi thu cach day 1 gio

        Optional<Long> id = service.findTeamId("Arsenal FC");

        assertThat(id).isEmpty();
        verify(client, never()).getTeamsInLeague(anyInt(), anyInt());
    }

    @Test
    void qua_thoi_gian_cho_thi_duoc_thu_lai() {
        when(repository.findAll()).thenReturn(List.of());
        when(repository.findLastUpdatedAt()).thenReturn(Optional.empty());
        when(repository.findById(anyString())).thenReturn(Optional.empty());
        lastAttempt(12); // qua 6 gio -> duoc thu lai
        when(client.getTeamsInLeague(anyInt(), anyInt())).thenReturn(List.of(team(42L, "Arsenal")));

        assertThat(service.findTeamId("Arsenal FC")).contains(42L);
    }

    @Test
    void goi_API_that_bai_thi_ghi_lai_moc_thoi_gian_de_lan_sau_biet_ma_cho() {
        when(repository.findAll()).thenReturn(List.of());
        when(repository.findLastUpdatedAt()).thenReturn(Optional.empty());
        when(client.getTeamsInLeague(anyInt(), anyInt())).thenReturn(List.of());

        service.findTeamId("Arsenal FC");

        verify(syncStateRepository).save(org.mockito.ArgumentMatchers.any(ApiFootballSyncState.class));
    }

    @Test
    void khop_mem_khi_ten_dai_ngan_khac_nhau() {
        when(repository.findAll()).thenReturn(List.of(row("newcastle", 34L)));
        when(repository.findLastUpdatedAt()).thenReturn(Optional.of(Instant.now()));

        assertThat(service.findTeamId("Newcastle United FC")).contains(34L);
    }

    @Test
    void ten_rong_hoac_toan_ky_tu_dac_biet_thi_tra_ve_rong() {
        when(repository.findAll()).thenReturn(List.of(row("arsenal", 42L)));
        when(repository.findLastUpdatedAt()).thenReturn(Optional.of(Instant.now()));

        assertThat(service.findTeamId("!!!")).isEmpty();
    }
}
