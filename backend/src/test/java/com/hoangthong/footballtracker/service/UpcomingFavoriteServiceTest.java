package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.dto.UpcomingFavoriteDto;
import com.hoangthong.footballtracker.entity.FavoriteTeam;
import com.hoangthong.footballtracker.entity.MatchFixture;
import com.hoangthong.footballtracker.entity.User;
import com.hoangthong.footballtracker.repository.FavoriteTeamRepository;
import com.hoangthong.footballtracker.repository.MatchFixtureRepository;
import com.hoangthong.footballtracker.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class UpcomingFavoriteServiceTest {

    private static final long ARSENAL = 57;
    private static final long CHELSEA = 61;
    private static final long LIVERPOOL = 64;

    private FavoriteTeamRepository favoriteRepository;
    private MatchFixtureRepository matchRepository;
    private UpcomingFavoriteService service;
    private final User user = new User("an@example.com", "hash");

    @BeforeEach
    void setUp() {
        UserRepository userRepository = mock(UserRepository.class);
        favoriteRepository = mock(FavoriteTeamRepository.class);
        matchRepository = mock(MatchFixtureRepository.class);
        when(userRepository.findByEmail("an@example.com")).thenReturn(Optional.of(user));
        service = new UpcomingFavoriteService(userRepository, favoriteRepository, matchRepository);
    }

    private void theoDoi(long... teamIds) {
        List<FavoriteTeam> follows = java.util.Arrays.stream(teamIds)
                .mapToObj(id -> new FavoriteTeam(user, id, "Doi " + id, null))
                .toList();
        when(favoriteRepository.findByUserId(any())).thenReturn(follows);
    }

    private MatchFixture tran(long id, long home, long away, int gioNua) {
        return tran(id, home, away, gioNua, "SCHEDULED");
    }

    private MatchFixture tran(long id, long home, long away, int gioNua, String status) {
        MatchFixture m = new MatchFixture(id);
        m.setCompetition("PL");
        m.setUtcDate(Instant.now().plus(gioNua, ChronoUnit.HOURS));
        m.setStatus(status);
        m.setHomeTeamId(home);
        m.setHomeTeam("Doi " + home);
        m.setAwayTeamId(away);
        m.setAwayTeam("Doi " + away);
        return m;
    }

    private void coCacTran(MatchFixture... matches) {
        when(matchRepository.findByStatusInAndUtcDateBetween(anyList(), any(), any()))
                .thenReturn(List.of(matches));
    }

    @Test
    void chi_lay_tran_co_doi_dang_theo_doi() {
        theoDoi(ARSENAL);
        coCacTran(
                tran(1, ARSENAL, CHELSEA, 10),
                tran(2, CHELSEA, LIVERPOOL, 20)); // khong lien quan

        List<UpcomingFavoriteDto> result = service.listFor("an@example.com");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).matchId()).isEqualTo(1);
    }

    @Test
    void tinh_ca_khi_doi_minh_theo_doi_da_san_khach() {
        theoDoi(ARSENAL);
        coCacTran(tran(1, CHELSEA, ARSENAL, 5));

        assertThat(service.listFor("an@example.com")).hasSize(1);
    }

    /** Theo doi ca hai doi trong cung mot tran thi chi ra MOT dong, khong lap. */
    @Test
    void tran_derby_khong_bi_hien_hai_lan() {
        theoDoi(ARSENAL, CHELSEA);
        coCacTran(tran(1, ARSENAL, CHELSEA, 8));

        List<UpcomingFavoriteDto> result = service.listFor("an@example.com");

        assertThat(result).hasSize(1);
        // Doi chu nha duoc chon lam "doi cua ban"
        assertThat(result.get(0).followedTeamId()).isEqualTo(ARSENAL);
    }

    @Test
    void sap_xep_theo_tran_gan_nhat_truoc() {
        theoDoi(ARSENAL);
        coCacTran(
                tran(1, ARSENAL, CHELSEA, 100),
                tran(2, LIVERPOOL, ARSENAL, 3),
                tran(3, ARSENAL, LIVERPOOL, 40));

        assertThat(service.listFor("an@example.com"))
                .extracting(UpcomingFavoriteDto::matchId)
                .containsExactly(2L, 3L, 1L);
    }

    @Test
    void chua_theo_doi_doi_nao_thi_khong_can_hoi_den_bang_tran() {
        when(favoriteRepository.findByUserId(any())).thenReturn(List.of());

        assertThat(service.listFor("an@example.com")).isEmpty();
        org.mockito.Mockito.verify(matchRepository, org.mockito.Mockito.never())
                .findByStatusInAndUtcDateBetween(anyList(), any(), any());
    }

    /** Tran da xong van hien, kem ti so - nguoi theo doi doi quan tam ca ket qua. */
    @Test
    void tran_da_ket_thuc_van_nam_trong_danh_sach_kem_ti_so() {
        theoDoi(ARSENAL);
        MatchFixture xong = tran(9, ARSENAL, CHELSEA, -20, "FINISHED");
        xong.setHomeScore(2);
        xong.setAwayScore(0);
        coCacTran(xong);

        UpcomingFavoriteDto row = service.listFor("an@example.com").get(0);

        assertThat(row.finished()).isTrue();
        assertThat(row.homeScore()).isEqualTo(2);
        assertThat(row.awayScore()).isZero();
    }

    /** Tran sap da phai nam TREN tran da xong: nguoi ta mo chuong de biet sap toi co gi. */
    @Test
    void tran_sap_da_xep_tren_tran_da_xong() {
        theoDoi(ARSENAL);
        coCacTran(
                tran(1, ARSENAL, CHELSEA, -20, "FINISHED"),
                tran(2, ARSENAL, LIVERPOOL, 30));

        assertThat(service.listFor("an@example.com"))
                .extracting(UpcomingFavoriteDto::matchId)
                .containsExactly(2L, 1L);
    }

    @Test
    void ten_doi_kem_theo_la_ten_doi_NGUOI_DUNG_theo_doi() {
        // Theo doi nhieu doi thi nhin cap dau khong doan duoc doi nao la cua minh
        theoDoi(LIVERPOOL);
        coCacTran(tran(1, ARSENAL, LIVERPOOL, 6));

        UpcomingFavoriteDto row = service.listFor("an@example.com").get(0);

        assertThat(row.followedTeamId()).isEqualTo(LIVERPOOL);
        assertThat(row.followedTeamName()).isEqualTo("Doi " + LIVERPOOL);
    }
}
