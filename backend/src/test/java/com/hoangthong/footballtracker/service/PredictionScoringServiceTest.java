package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.entity.MatchFixture;
import com.hoangthong.footballtracker.entity.Prediction;
import com.hoangthong.footballtracker.entity.User;
import com.hoangthong.footballtracker.repository.MatchFixtureRepository;
import com.hoangthong.footballtracker.repository.PredictionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PredictionScoringServiceTest {

    private MatchFixtureRepository matchRepository;
    private PredictionRepository predictionRepository;
    private BadgeService badgeService;
    private PredictionScoringService service;

    @BeforeEach
    void setUp() {
        matchRepository = mock(MatchFixtureRepository.class);
        predictionRepository = mock(PredictionRepository.class);
        badgeService = mock(BadgeService.class);
        service = new PredictionScoringService(matchRepository, predictionRepository, badgeService);
    }

    private static MatchFixture finishedMatch(long id, int homeScore, int awayScore) {
        MatchFixture m = new MatchFixture(id);
        m.setStatus("FINISHED");
        m.setHomeScore(homeScore);
        m.setAwayScore(awayScore);
        return m;
    }

    @ParameterizedTest(name = "du doan {0}-{1}, that {2}-{3} -> {4} diem")
    @CsvSource({
            // dung chinh xac ti so
            "2, 1, 2, 1, 3",
            "0, 0, 0, 0, 3",
            // dung ket qua (ai thang/hoa) nhung sai ti so cu the
            "2, 0, 1, 0, 1", // du doan chu nha thang, that chu nha thang (ti so khac)
            "1, 1, 3, 3, 1", // du doan hoa, that hoa (ti so khac)
            "0, 2, 0, 1, 1", // du doan khach thang, that khach thang (ti so khac)
            // sai hoan toan ket qua
            "2, 0, 0, 2, 0", // du doan chu nha thang, thuc te khach thang
            "1, 1, 2, 0, 0", // du doan hoa, thuc te chu nha thang
            "2, 0, 1, 1, 0", // du doan chu nha thang, thuc te hoa
    })
    void computePoints_dung_luat_cham_diem(int predHome, int predAway, int actualHome, int actualAway, int expected) {
        assertThat(service.computePoints(predHome, predAway, actualHome, actualAway)).isEqualTo(expected);
    }

    @Test
    void cham_diem_cac_du_doan_chua_cham_cua_tran_da_ket_thuc() {
        MatchFixture match = finishedMatch(100, 2, 1);
        when(matchRepository.findByStatus("FINISHED")).thenReturn(List.of(match));

        User u1 = new User("a@example.com", "hash");
        User u2 = new User("b@example.com", "hash");
        Prediction exact = new Prediction(u1, match, 2, 1); // dung chinh xac
        Prediction wrong = new Prediction(u2, match, 0, 0); // sai

        when(predictionRepository.findByMatchAndPointsIsNull(match)).thenReturn(List.of(exact, wrong));

        service.scoreFinishedMatches();

        assertThat(exact.getPoints()).isEqualTo(3);
        assertThat(wrong.getPoints()).isEqualTo(0);
        verify(predictionRepository, times(2)).save(any(Prediction.class));
    }

    @Test
    void tran_chua_co_ti_so_that_thi_bo_qua_khong_cham() {
        MatchFixture match = new MatchFixture(101);
        match.setStatus("FINISHED");
        match.setHomeScore(null);
        match.setAwayScore(null);
        when(matchRepository.findByStatus("FINISHED")).thenReturn(List.of(match));

        service.scoreFinishedMatches();

        verify(predictionRepository, never()).findByMatchAndPointsIsNull(any());
        verify(predictionRepository, never()).save(any());
    }

    @Test
    void khong_co_tran_ket_thuc_nao_thi_khong_lam_gi() {
        when(matchRepository.findByStatus("FINISHED")).thenReturn(List.of());

        service.scoreFinishedMatches();

        verify(predictionRepository, never()).save(any());
    }
}
