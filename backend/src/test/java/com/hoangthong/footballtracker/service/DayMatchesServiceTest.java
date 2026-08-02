package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.dto.DayMatchDto;
import com.hoangthong.footballtracker.entity.MatchFixture;
import com.hoangthong.footballtracker.repository.MatchFixtureRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DayMatchesServiceTest {

    private MatchFixtureRepository repository;
    private DayMatchesService service;

    @BeforeEach
    void setUp() {
        repository = mock(MatchFixtureRepository.class);
        service = new DayMatchesService(repository);
    }

    private static MatchFixture fixture(long id, String competition, String utcDate, String status,
                                        Integer homeScore, Integer awayScore) {
        MatchFixture m = new MatchFixture(id);
        m.setCompetition(competition);
        m.setUtcDate(Instant.parse(utcDate));
        m.setStatus(status);
        m.setMatchday(5);
        m.setHomeTeam("Chu nha");
        m.setHomeCrest("https://crest/1.png");
        m.setAwayTeam("Khach");
        m.setAwayCrest("https://crest/2.png");
        m.setHomeScore(homeScore);
        m.setAwayScore(awayScore);
        return m;
    }

    @Test
    void map_dung_cac_truong_sang_DayMatchDto() {
        Instant from = Instant.parse("2026-08-02T17:00:00Z");
        Instant to = Instant.parse("2026-08-03T17:00:00Z");
        when(repository.findByUtcDateBetweenOrderByUtcDateAsc(from, to))
                .thenReturn(List.of(fixture(100, "PL", "2026-08-03T14:00:00Z", "FINISHED", 2, 1)));

        List<DayMatchDto> result = service.getMatchesBetween(from, to);

        assertThat(result).hasSize(1);
        DayMatchDto dto = result.get(0);
        assertThat(dto.id()).isEqualTo(100);
        assertThat(dto.competition()).isEqualTo("PL");
        assertThat(dto.status()).isEqualTo("FINISHED");
        assertThat(dto.homeTeam()).isEqualTo("Chu nha");
        assertThat(dto.awayTeam()).isEqualTo("Khach");
        assertThat(dto.homeScore()).isEqualTo(2);
        assertThat(dto.awayScore()).isEqualTo(1);
    }

    @Test
    void tran_chua_da_thi_ti_so_van_la_null() {
        Instant from = Instant.parse("2026-08-02T17:00:00Z");
        Instant to = Instant.parse("2026-08-03T17:00:00Z");
        when(repository.findByUtcDateBetweenOrderByUtcDateAsc(from, to))
                .thenReturn(List.of(fixture(101, "CL", "2026-08-03T19:00:00Z", "TIMED", null, null)));

        DayMatchDto dto = service.getMatchesBetween(from, to).get(0);

        assertThat(dto.homeScore()).isNull();
        assertThat(dto.awayScore()).isNull();
    }

    @Test
    void khong_co_tran_nao_thi_tra_danh_sach_rong() {
        Instant from = Instant.parse("2026-08-02T17:00:00Z");
        Instant to = Instant.parse("2026-08-03T17:00:00Z");
        when(repository.findByUtcDateBetweenOrderByUtcDateAsc(from, to)).thenReturn(List.of());

        assertThat(service.getMatchesBetween(from, to)).isEmpty();
    }

    @Test
    void from_sau_to_thi_bao_loi_400_va_khong_truy_van_DB() {
        Instant from = Instant.parse("2026-08-03T17:00:00Z");
        Instant to = Instant.parse("2026-08-02T17:00:00Z");

        assertThatThrownBy(() -> service.getMatchesBetween(from, to))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("khong hop le");

        verify(repository, never()).findByUtcDateBetweenOrderByUtcDateAsc(any(), any());
    }

    @Test
    void khoang_rong_hon_7_ngay_thi_bao_loi_400() {
        Instant from = Instant.parse("2026-08-01T00:00:00Z");
        Instant to = Instant.parse("2026-08-15T00:00:00Z");

        assertThatThrownBy(() -> service.getMatchesBetween(from, to))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("7 ngay");

        verify(repository, never()).findByUtcDateBetweenOrderByUtcDateAsc(any(), any());
    }

    @Test
    void thieu_tham_so_thi_bao_loi_400() {
        assertThatThrownBy(() -> service.getMatchesBetween(null, Instant.now()))
                .isInstanceOf(ResponseStatusException.class);
    }
}
