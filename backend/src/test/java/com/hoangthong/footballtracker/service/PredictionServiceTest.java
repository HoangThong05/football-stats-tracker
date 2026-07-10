package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.dto.LeaderboardEntryDto;
import com.hoangthong.footballtracker.dto.PredictableMatchDto;
import com.hoangthong.footballtracker.dto.PredictionRequest;
import com.hoangthong.footballtracker.entity.MatchFixture;
import com.hoangthong.footballtracker.entity.Prediction;
import com.hoangthong.footballtracker.entity.User;
import com.hoangthong.footballtracker.repository.MatchFixtureRepository;
import com.hoangthong.footballtracker.repository.PredictionRepository;
import com.hoangthong.footballtracker.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PredictionServiceTest {

    private static final String EMAIL = "an@example.com";

    private MatchFixtureRepository matchRepository;
    private PredictionRepository predictionRepository;
    private UserRepository userRepository;
    private PredictionService service;
    private User user;

    @BeforeEach
    void setUp() {
        matchRepository = mock(MatchFixtureRepository.class);
        predictionRepository = mock(PredictionRepository.class);
        userRepository = mock(UserRepository.class);
        service = new PredictionService(matchRepository, predictionRepository, userRepository);

        user = new User(EMAIL, "hash");
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
    }

    private static MatchFixture upcomingMatch(long id, Instant utcDate) {
        MatchFixture m = new MatchFixture(id);
        m.setCompetition("PL");
        m.setStatus("SCHEDULED");
        m.setUtcDate(utcDate);
        m.setHomeTeam("Doi Nha");
        m.setAwayTeam("Doi Khach");
        return m;
    }

    @Test
    void gui_du_doan_cho_tran_chua_bat_dau_thi_luu_thanh_cong() {
        MatchFixture match = upcomingMatch(1, Instant.now().plus(2, ChronoUnit.DAYS));
        when(matchRepository.findById(1L)).thenReturn(Optional.of(match));
        when(predictionRepository.findByUserIdAndMatchId(any(), anyLong())).thenReturn(Optional.empty());

        service.submitPrediction(EMAIL, new PredictionRequest(1, 2, 1));

        verify(predictionRepository).save(any(Prediction.class));
    }

    @Test
    void gui_du_doan_lan_2_thi_CAP_NHAT_khong_tao_ban_ghi_moi() {
        MatchFixture match = upcomingMatch(1, Instant.now().plus(2, ChronoUnit.DAYS));
        Prediction existing = new Prediction(user, match, 0, 0);

        when(matchRepository.findById(1L)).thenReturn(Optional.of(match));
        when(predictionRepository.findByUserIdAndMatchId(any(), anyLong())).thenReturn(Optional.of(existing));

        service.submitPrediction(EMAIL, new PredictionRequest(1, 3, 2));

        assertThat(existing.getPredictedHomeScore()).isEqualTo(3);
        assertThat(existing.getPredictedAwayScore()).isEqualTo(2);
        verify(predictionRepository).save(existing);
    }

    @Test
    void tran_da_bat_dau_thi_tu_choi_du_doan_409() {
        MatchFixture match = upcomingMatch(1, Instant.now().minus(1, ChronoUnit.HOURS));
        when(matchRepository.findById(1L)).thenReturn(Optional.of(match));

        assertThatThrownBy(() -> service.submitPrediction(EMAIL, new PredictionRequest(1, 2, 1)))
                .isInstanceOf(ResponseStatusException.class)
                .hasFieldOrPropertyWithValue("statusCode", HttpStatus.CONFLICT);

        verify(predictionRepository, never()).save(any());
    }

    @Test
    void tran_khong_ton_tai_thi_tra_404() {
        when(matchRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.submitPrediction(EMAIL, new PredictionRequest(999, 1, 1)))
                .isInstanceOf(ResponseStatusException.class)
                .hasFieldOrPropertyWithValue("statusCode", HttpStatus.NOT_FOUND);
    }

    @Test
    void ti_so_am_thi_tra_400_khong_can_kiem_tra_DB() {
        assertThatThrownBy(() -> service.submitPrediction(EMAIL, new PredictionRequest(1, -1, 0)))
                .isInstanceOf(ResponseStatusException.class)
                .hasFieldOrPropertyWithValue("statusCode", HttpStatus.BAD_REQUEST);

        verify(matchRepository, never()).findById(any());
    }

    @Test
    void danh_sach_tran_sap_dien_ra_khi_CHUA_dang_nhap_thi_du_doan_luon_null() {
        MatchFixture match = upcomingMatch(1, Instant.now().plus(1, ChronoUnit.DAYS));
        when(matchRepository.findByCompetitionAndStatusInOrderByUtcDateAsc(any(), any()))
                .thenReturn(List.of(match));

        List<PredictableMatchDto> result = service.getUpcomingMatches("PL", null);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).myHomeScore()).isNull();
        assertThat(result.get(0).myAwayScore()).isNull();
        verify(userRepository, never()).findByEmail(any());
    }

    @Test
    void danh_sach_tran_sap_dien_ra_khi_DA_dang_nhap_va_da_du_doan_thi_dien_san() {
        MatchFixture match = upcomingMatch(1, Instant.now().plus(1, ChronoUnit.DAYS));
        Prediction existing = new Prediction(user, match, 2, 0);

        when(matchRepository.findByCompetitionAndStatusInOrderByUtcDateAsc(any(), any()))
                .thenReturn(List.of(match));
        when(predictionRepository.findByUserIdAndCompetition(any(), any())).thenReturn(List.of(existing));

        List<PredictableMatchDto> result = service.getUpcomingMatches("PL", EMAIL);

        assertThat(result.get(0).myHomeScore()).isEqualTo(2);
        assertThat(result.get(0).myAwayScore()).isEqualTo(0);
    }

    @Test
    void bang_xep_hang_danh_so_thu_hang_tang_dan_tu_1() {
        PredictionRepository.LeaderboardRow row1 = leaderboardRow("top@example.com", 15L, 5L);
        PredictionRepository.LeaderboardRow row2 = leaderboardRow("nhi@example.com", 9L, 4L);
        when(predictionRepository.findLeaderboard()).thenReturn(List.of(row1, row2));

        List<LeaderboardEntryDto> result = service.getLeaderboard();

        assertThat(result).extracting(LeaderboardEntryDto::rank).containsExactly(1, 2);
        assertThat(result).extracting(LeaderboardEntryDto::email)
                .containsExactly("top@example.com", "nhi@example.com");
        assertThat(result.get(0).totalPoints()).isEqualTo(15L);
    }

    private static PredictionRepository.LeaderboardRow leaderboardRow(String email, long points, long count) {
        return new PredictionRepository.LeaderboardRow() {
            public String getEmail() {
                return email;
            }

            public Long getTotalPoints() {
                return points;
            }

            public Long getTotalPredictions() {
                return count;
            }
        };
    }
}
