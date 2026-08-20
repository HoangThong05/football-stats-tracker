package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.dto.UpcomingFavoriteDto;
import com.hoangthong.footballtracker.entity.FavoriteTeam;
import com.hoangthong.footballtracker.entity.MatchFixture;
import com.hoangthong.footballtracker.entity.User;
import com.hoangthong.footballtracker.repository.FavoriteTeamRepository;
import com.hoangthong.footballtracker.repository.MatchFixtureRepository;
import com.hoangthong.footballtracker.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Cac tran sap dien ra cua nhung doi nguoi dung dang theo doi.
 *
 * Doc thang tu database (MatchSyncService da dong bo san) nen KHONG ton request nao
 * cua football-data.org - goi bao nhieu lan cung duoc, khong so cham han muc 10/phut.
 */
@Service
public class UpcomingFavoriteService {

    private static final List<String> SHOWN_STATUSES =
            List.of("SCHEDULED", "TIMED", "IN_PLAY", "PAUSED", "FINISHED");

    /**
     * Nhin toi 7 ngay: du de biet cuoi tuan doi minh da voi ai.
     *
     * Lay het ca mua thi danh sach luon dai va con so tren chuong luon lon - nhin mai
     * thanh quen, het tac dung nhac nho.
     */
    private static final Duration AHEAD = Duration.ofDays(7);

    /**
     * Nhin lui 2 ngay de con thay KET QUA tran vua da.
     *
     * Nguoi theo doi mot doi quan tam ket qua khong kem gi lich thi dau - bao tran sap
     * da roi im bat khi tran da xong la bo do nua cau chuyen.
     */
    private static final Duration BEHIND = Duration.ofDays(2);

    private final UserRepository userRepository;
    private final FavoriteTeamRepository favoriteRepository;
    private final MatchFixtureRepository matchRepository;

    public UpcomingFavoriteService(UserRepository userRepository,
                                   FavoriteTeamRepository favoriteRepository,
                                   MatchFixtureRepository matchRepository) {
        this.userRepository = userRepository;
        this.favoriteRepository = favoriteRepository;
        this.matchRepository = matchRepository;
    }

    public List<UpcomingFavoriteDto> listFor(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid_credentials"));

        List<FavoriteTeam> follows = favoriteRepository.findByUserId(user.getId());
        if (follows.isEmpty()) {
            return List.of();
        }

        Map<Long, String> followedNames = new HashMap<>();
        for (FavoriteTeam f : follows) {
            followedNames.put(f.getTeamId(), f.getTeamName());
        }

        Instant now = Instant.now();
        List<MatchFixture> matches = matchRepository.findByStatusInAndUtcDateBetween(
                SHOWN_STATUSES, now.minus(BEHIND), now.plus(AHEAD));

        List<UpcomingFavoriteDto> result = new ArrayList<>();
        for (MatchFixture m : matches) {
            /*
             * Mot tran co the dinh CA HAI doi ma nguoi dung theo doi (derby). Khi do chi
             * lay doi chu nha lam "doi cua ban" - van la mot dong trong danh sach, khong
             * hien tran do hai lan.
             */
            Long followedId = null;
            if (followedNames.containsKey(m.getHomeTeamId())) {
                followedId = m.getHomeTeamId();
            } else if (followedNames.containsKey(m.getAwayTeamId())) {
                followedId = m.getAwayTeamId();
            }
            if (followedId == null) {
                continue;
            }

            result.add(new UpcomingFavoriteDto(
                    m.getId(),
                    m.getCompetition(),
                    m.getUtcDate(),
                    followedId,
                    followedNames.get(followedId),
                    m.getHomeTeamId(), m.getHomeTeam(), m.getHomeCrest(),
                    m.getAwayTeamId(), m.getAwayTeam(), m.getAwayCrest(),
                    m.getStatus(), m.getHomeScore(), m.getAwayScore()));
        }

        /*
         * Tran sap da len truoc (gan nhat truoc), tran da xong xuong duoi (moi nhat truoc).
         * Nguoi mo chuong ra chu yeu de biet sap toi co gi; de tran hom kia nam tren
         * tran toi nay thi nguoc voi cai ho can.
         */
        result.sort(Comparator
                .comparing(UpcomingFavoriteDto::finished)
                .thenComparing(r -> r.finished() ? -r.utcDate().getEpochSecond() : r.utcDate().getEpochSecond()));
        return result;
    }
}
