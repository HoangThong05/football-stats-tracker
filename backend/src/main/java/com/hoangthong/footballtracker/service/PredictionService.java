package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.dto.LeaderboardEntryDto;
import com.hoangthong.footballtracker.dto.PredictableMatchDto;
import com.hoangthong.footballtracker.dto.PredictionHistoryDto;
import com.hoangthong.footballtracker.dto.PredictionRequest;
import com.hoangthong.footballtracker.entity.MatchFixture;
import com.hoangthong.footballtracker.entity.Prediction;
import com.hoangthong.footballtracker.entity.User;
import com.hoangthong.footballtracker.repository.MatchFixtureRepository;
import com.hoangthong.footballtracker.repository.PredictionRepository;
import com.hoangthong.footballtracker.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Nguoi dung du doan ti so cac tran SAP dien ra (chua bat dau).
 * Diem duoc PredictionScoringService cham tu dong sau khi tran ket thuc.
 */
@Service
public class PredictionService {

    private static final List<String> UPCOMING_STATUSES = List.of("SCHEDULED", "TIMED");
    private static final int MAX_LEADERBOARD_SIZE = 50;

    private final MatchFixtureRepository matchRepository;
    private final PredictionRepository predictionRepository;
    private final UserRepository userRepository;
    private final com.hoangthong.footballtracker.repository.WeeklyChampionRepository championRepository;

    public PredictionService(
            MatchFixtureRepository matchRepository,
            PredictionRepository predictionRepository,
            UserRepository userRepository,
            com.hoangthong.footballtracker.repository.WeeklyChampionRepository championRepository) {
        this.matchRepository = matchRepository;
        this.predictionRepository = predictionRepository;
        this.userRepository = userRepository;
        this.championRepository = championRepository;
    }

    /** Cac lan "Nhat tuan" cua chinh nguoi dung (moi nhat truoc) - cho chuong thong bao. */
    public List<com.hoangthong.footballtracker.dto.WeeklyChampionDto> myWeeklyChampions(String email) {
        User user = findUser(email);
        var page = org.springframework.data.domain.PageRequest.of(0, 12);
        return championRepository.findByUserIdOrderByWeekStartDesc(user.getId(), page).stream()
                .map(c -> new com.hoangthong.footballtracker.dto.WeeklyChampionDto(
                        c.getWeekStart(), c.getPoints(), c.getCreatedAt()))
                .toList();
    }

    /**
     * Danh sach tran sap dien ra cua 1 giai, kem du doan hien tai cua user (neu co dang nhap).
     * email = null (chua dang nhap) -> myHomeScore/myAwayScore luon null.
     */
    public List<PredictableMatchDto> getUpcomingMatches(String competitionCode, String email) {
        List<MatchFixture> matches =
                matchRepository.findByCompetitionAndStatusInOrderByUtcDateAsc(competitionCode, UPCOMING_STATUSES);

        Map<Long, Prediction> myPredictions = new HashMap<>();
        if (email != null) {
            userRepository.findByEmail(email).ifPresent(user -> {
                for (Prediction p : predictionRepository.findByUserIdAndCompetition(user.getId(), competitionCode)) {
                    myPredictions.put(p.getMatch().getId(), p);
                }
            });
        }

        return matches.stream()
                .map(m -> {
                    Prediction mine = myPredictions.get(m.getId());
                    return new PredictableMatchDto(
                            m.getId(),
                            m.getUtcDate().toString(),
                            m.getMatchday(),
                            m.getHomeTeam(),
                            m.getHomeCrest(),
                            m.getAwayTeam(),
                            m.getAwayCrest(),
                            mine != null ? mine.getPredictedHomeScore() : null,
                            mine != null ? mine.getPredictedAwayScore() : null
                    );
                })
                .toList();
    }

    /**
     * Ti so du doan toi da cho mot doi. Tran bong that gan nhu khong bao gio qua so nay;
     * chan tren de khong ai nhet 2 ty vao lam tran bang / gay tran so khi cham diem.
     */
    private static final int MAX_SCORE = 99;

    /** Tao moi hoac sua du doan (chi khi tran chua bat dau). */
    public void submitPrediction(String email, PredictionRequest request) {
        if (request.homeScore() < 0 || request.awayScore() < 0
                || request.homeScore() > MAX_SCORE || request.awayScore() > MAX_SCORE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ti so khong hop le");
        }

        User user = findUser(email);

        MatchFixture match = matchRepository.findById(request.matchId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Tran dau khong ton tai hoac chua duoc dong bo"));

        if (!Instant.now().isBefore(match.getUtcDate())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tran da bat dau, khong the du doan nua");
        }

        Optional<Prediction> existing = predictionRepository.findByUserIdAndMatchId(user.getId(), match.getId());
        if (existing.isPresent()) {
            existing.get().updateGuess(request.homeScore(), request.awayScore());
            predictionRepository.save(existing.get());
        } else {
            predictionRepository.save(new Prediction(user, match, request.homeScore(), request.awayScore()));
        }
    }

    /** Toan bo lich su du doan cua user (moi giai, ca da/chua cham diem), tran gan nhat truoc. */
    public List<PredictionHistoryDto> getMyHistory(String email) {
        User user = findUser(email);

        return predictionRepository.findByUserIdWithMatch(user.getId()).stream()
                .map(p -> {
                    MatchFixture m = p.getMatch();
                    return new PredictionHistoryDto(
                            m.getId(),
                            m.getCompetition(),
                            m.getMatchday(),
                            m.getUtcDate().toString(),
                            m.getStatus(),
                            m.getHomeTeam(),
                            m.getHomeCrest(),
                            m.getAwayTeam(),
                            m.getAwayCrest(),
                            m.getHomeScore(),
                            m.getAwayScore(),
                            p.getPredictedHomeScore(),
                            p.getPredictedAwayScore(),
                            p.getPoints()
                    );
                })
                .toList();
    }

    /** Top nguoi du doan diem cao nhat (chi tinh du doan da cham diem). */
    public List<LeaderboardEntryDto> getLeaderboard() {
        return toEntries(predictionRepository.findLeaderboard());
    }

    /** BXH du doan cua cac tran trong [from, to) - dung cho BXH theo tuan. */
    public List<LeaderboardEntryDto> getLeaderboardBetween(java.time.Instant from, java.time.Instant to) {
        return toEntries(predictionRepository.findLeaderboardBetween(from, to));
    }

    /** Danh so thu hang + doi ten hien thi - dung chung cho BXH toan mua va theo tuan. */
    private List<LeaderboardEntryDto> toEntries(List<PredictionRepository.LeaderboardRow> rows) {
        List<LeaderboardEntryDto> result = new java.util.ArrayList<>();
        int rank = 1;
        for (PredictionRepository.LeaderboardRow row : rows) {
            if (rank > MAX_LEADERBOARD_SIZE) break;
            // Ten hien thi, chua dat thi lay phan truoc dau @ - khong bao gio tra ca email ra
            String name = row.getDisplayName() != null && !row.getDisplayName().isBlank()
                    ? row.getDisplayName()
                    : com.hoangthong.footballtracker.entity.User.fallbackName(row.getEmail());
            result.add(new LeaderboardEntryDto(rank++, row.getUserId(), name, row.getAvatarUrl(),
                    row.getTotalPoints(), row.getTotalPredictions()));
        }
        return result;
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Nguoi dung khong ton tai"));
    }
}
