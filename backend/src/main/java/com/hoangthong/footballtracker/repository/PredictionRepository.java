package com.hoangthong.footballtracker.repository;

import com.hoangthong.footballtracker.entity.MatchFixture;
import com.hoangthong.footballtracker.entity.Prediction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PredictionRepository extends JpaRepository<Prediction, Long> {

    Optional<Prediction> findByUserIdAndMatchId(Long userId, long matchId);

    /** Du doan chua cham diem cua 1 tran cu the -> dung khi tran vua ket thuc. */
    List<Prediction> findByMatchAndPointsIsNull(MatchFixture match);

    /**
     * JOIN FETCH match ngay trong 1 truy van, tranh N+1 va tranh
     * LazyInitializationException khi doc match ben ngoai transaction
     * (project dang dat spring.jpa.open-in-view=false).
     */
    @Query("SELECT p FROM Prediction p JOIN FETCH p.match WHERE p.user.id = :userId ORDER BY p.match.utcDate DESC")
    List<Prediction> findByUserIdWithMatch(@Param("userId") Long userId);

    @Query("SELECT p FROM Prediction p JOIN FETCH p.match m "
            + "WHERE p.user.id = :userId AND m.competition = :competition "
            + "ORDER BY m.utcDate ASC")
    List<Prediction> findByUserIdAndCompetition(@Param("userId") Long userId, @Param("competition") String competition);

    /** Du doan da cham diem cua 1 user, tran cu -> moi. Dung de tinh badge thanh tich. */
    @Query("SELECT p FROM Prediction p JOIN FETCH p.match m "
            + "WHERE p.user.id = :userId AND p.points IS NOT NULL "
            + "ORDER BY m.utcDate ASC")
    List<Prediction> findScoredByUserIdOrderByMatchDateAsc(@Param("userId") Long userId);

    /** Bang xep hang: tong diem + so lan du doan cua tung nguoi (chi tinh du doan da cham diem). */
    @Query("SELECT u.email AS email, "
            + "COALESCE(SUM(p.points), 0) AS totalPoints, "
            + "COUNT(p) AS totalPredictions "
            + "FROM Prediction p JOIN p.user u "
            + "WHERE p.points IS NOT NULL "
            + "GROUP BY u.email "
            + "ORDER BY totalPoints DESC")
    List<LeaderboardRow> findLeaderboard();

    interface LeaderboardRow {
        String getEmail();

        Long getTotalPoints();

        Long getTotalPredictions();
    }
}
