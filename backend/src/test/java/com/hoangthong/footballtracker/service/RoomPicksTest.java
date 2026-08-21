package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.dto.MiniLeagueDto;
import com.hoangthong.footballtracker.entity.LeagueMember;
import com.hoangthong.footballtracker.entity.MatchFixture;
import com.hoangthong.footballtracker.entity.MiniLeague;
import com.hoangthong.footballtracker.entity.Prediction;
import com.hoangthong.footballtracker.entity.User;
import com.hoangthong.footballtracker.repository.LeagueMemberRepository;
import com.hoangthong.footballtracker.repository.MiniLeagueRepository;
import com.hoangthong.footballtracker.repository.PredictionRepository;
import com.hoangthong.footballtracker.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Du doan cua ca phong.
 *
 * Diem song con: KHONG duoc lo du doan cua tran chua lan banh. Lo ra thi nguoi vao sau
 * chi viec chep cua nguoi vao truoc va tro choi mat sach y nghia.
 */
class RoomPicksTest {

    private MiniLeagueRepository leagueRepo;
    private LeagueMemberRepository memberRepo;
    private PredictionRepository predictionRepo;
    private MiniLeagueService service;

    private final User huy = user(1L, "huy@example.com");
    private final User thong = user(2L, "thong@example.com");
    private final MiniLeague league = new MiniLeague("Phong test", "HT4JRY", huy);

    private static User user(long id, String email) {
        User u = new User(email, "hash");
        try {
            var f = User.class.getDeclaredField("id");
            f.setAccessible(true);
            f.set(u, id);
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException(e);
        }
        return u;
    }

    @BeforeEach
    void setUp() {
        leagueRepo = mock(MiniLeagueRepository.class);
        memberRepo = mock(LeagueMemberRepository.class);
        predictionRepo = mock(PredictionRepository.class);
        UserRepository userRepo = mock(UserRepository.class);

        when(userRepo.findByEmail("huy@example.com")).thenReturn(Optional.of(huy));
        when(leagueRepo.findById(1L)).thenReturn(Optional.of(league));
        when(memberRepo.existsByLeagueAndUser(any(), any())).thenReturn(true);
        when(memberRepo.findByLeague(league))
                .thenReturn(List.of(new LeagueMember(league, huy), new LeagueMember(league, thong)));

        service = new MiniLeagueService(leagueRepo, memberRepo, userRepo, predictionRepo);
    }

    private Prediction pick(User u, MatchFixture m, int home, int away, Integer points) {
        Prediction p = new Prediction(u, m, home, away);
        p.setPoints(points);
        return p;
    }

    private MatchFixture tran(long id, int gioTruoc) {
        MatchFixture m = new MatchFixture(id);
        m.setCompetition("PL");
        m.setUtcDate(Instant.now().minus(gioTruoc, ChronoUnit.HOURS));
        m.setStatus("FINISHED");
        m.setHomeTeam("Arsenal");
        m.setAwayTeam("Chelsea");
        return m;
    }

    /** Chan nam ngay trong truy van, khong phai loc o tang tren. */
    @Test
    void chi_hoi_du_doan_cua_tran_da_lan_banh() {
        when(predictionRepo.findRevealedForUsers(anyCollection(), any(), any())).thenReturn(List.of());

        service.roomPicks("huy@example.com", 1L);

        ArgumentCaptor<Instant> now = ArgumentCaptor.forClass(Instant.class);
        org.mockito.Mockito.verify(predictionRepo)
                .findRevealedForUsers(anyCollection(), now.capture(), any());
        // Moc "bay gio" phai la hien tai, khong phai mot moc tuong lai nao do
        assertThat(now.getValue()).isBetween(Instant.now().minusSeconds(5), Instant.now().plusSeconds(1));
    }

    @Test
    void gom_du_doan_cua_moi_nguoi_vao_cung_mot_tran() {
        MatchFixture m = tran(100, 3);
        when(predictionRepo.findRevealedForUsers(anyCollection(), any(), any()))
                .thenReturn(List.of(pick(huy, m, 2, 1, 3), pick(thong, m, 0, 3, 0)));

        List<MiniLeagueDto.RoomMatchPicks> rows = service.roomPicks("huy@example.com", 1L);

        assertThat(rows).hasSize(1);
        assertThat(rows.get(0).picks()).hasSize(2);
    }

    @Test
    void trong_mot_tran_diem_cao_xep_truoc() {
        MatchFixture m = tran(100, 3);
        when(predictionRepo.findRevealedForUsers(anyCollection(), any(), any()))
                .thenReturn(List.of(pick(thong, m, 0, 3, 0), pick(huy, m, 2, 1, 3)));

        var picks = service.roomPicks("huy@example.com", 1L).get(0).picks();

        assertThat(picks.get(0).name()).isEqualTo("huy");
        assertThat(picks.get(0).points()).isEqualTo(3);
    }

    @Test
    void nguoi_ngoai_phong_khong_xem_duoc() {
        when(memberRepo.existsByLeagueAndUser(any(), any())).thenReturn(false);

        assertThatThrownBy(() -> service.roomPicks("huy@example.com", 1L))
                .hasMessageContaining("not_a_member");
    }
}
