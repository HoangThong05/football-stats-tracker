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

    /** Du doan dang dat x2 cua user cho cac tran trong [from, to) - kiem "1 x2/tuan". */
    @Query("SELECT p FROM Prediction p JOIN FETCH p.match m "
            + "WHERE p.user.id = :userId AND p.doubled = true "
            + "AND m.utcDate >= :from AND m.utcDate < :to")
    List<Prediction> findDoubledInWeek(@Param("userId") Long userId,
                                       @Param("from") java.time.Instant from,
                                       @Param("to") java.time.Instant to);

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

    /**
     * Diem tung du doan DA CHAM, tran cu -> moi. Chi lay so, khong nap ca tran.
     * Dung ve bieu do tong diem tich luy tren ho so cong khai.
     */
    @Query("SELECT p.points FROM Prediction p JOIN p.match m "
            + "WHERE p.user.id = :userId AND p.points IS NOT NULL "
            + "ORDER BY m.utcDate ASC")
    List<Integer> findScoredPointsOrderByDate(@Param("userId") Long userId);

    /** Tong hop thanh tich cua 1 user, dung cho ho so cong khai. */
    @Query("SELECT COALESCE(SUM(p.points), 0) AS totalPoints, "
            + "COUNT(p) AS scored, "
            + "COALESCE(SUM(CASE WHEN p.points = 3 THEN 1 ELSE 0 END), 0) AS exactScores "
            + "FROM Prediction p WHERE p.user.id = :userId AND p.points IS NOT NULL")
    ProfileStatsRow findProfileStats(@Param("userId") Long userId);

    interface ProfileStatsRow {
        Long getTotalPoints();

        Long getScored();

        Long getExactScores();
    }

    /** Du doan cua 1 user cho cac tran trong khoang thoi gian - dung cho chuong nhac. */
    @Query("SELECT p FROM Prediction p JOIN FETCH p.match m "
            + "WHERE p.user.id = :userId AND m.utcDate BETWEEN :from AND :to")
    List<Prediction> findByUserIdInWindow(@Param("userId") Long userId,
                                          @Param("from") java.time.Instant from,
                                          @Param("to") java.time.Instant to);

    /** Bang xep hang: tong diem + so lan du doan cua tung nguoi (chi tinh du doan da cham diem). */
    /**
     * Du doan cua NHIEU nguoi cho cac tran DA LAN BANH, dung cho man "ca phong doan gi".
     *
     * Chan bang utcDate < :now ngay trong truy van chu khong loc o tang tren: du doan
     * cua tran chua da la thong tin phai giau: lo ra thi ai vao sau cu chep cua nguoi
     * vao truoc, hong ca tro choi.
     */
    @Query("""
            SELECT p FROM Prediction p
            JOIN FETCH p.match m
            JOIN FETCH p.user u
            WHERE p.user.id IN :userIds
              AND m.utcDate < :now
              AND m.utcDate >= :since
            ORDER BY m.utcDate DESC
            """)
    List<Prediction> findRevealedForUsers(@Param("userIds") java.util.Collection<Long> userIds,
                                          @Param("now") java.time.Instant now,
                                          @Param("since") java.time.Instant since);

    @Query("SELECT u.id AS userId, "
            + "u.email AS email, "
            + "u.displayName AS displayName, "
            + "u.avatarUrl AS avatarUrl, "
            + "u.featuredBadge AS featuredBadge, "
            + "COALESCE(SUM(p.points), 0) AS totalPoints, "
            + "COUNT(p) AS totalPredictions "
            + "FROM Prediction p JOIN p.user u "
            + "WHERE p.points IS NOT NULL "
            // Postgres bat MOI cot khong nam trong ham gop phai co mat o GROUP BY
            + "GROUP BY u.id, u.email, u.displayName, u.avatarUrl, u.featuredBadge "
            + "ORDER BY totalPoints DESC")
    List<LeaderboardRow> findLeaderboard();

    /**
     * BXH du doan chi tinh cac tran co gio bong lan trong [from, to) - dung cho BXH theo
     * tuan. JOIN p.match m de loc theo m.utcDate.
     */
    @Query("SELECT u.id AS userId, "
            + "u.email AS email, "
            + "u.displayName AS displayName, "
            + "u.avatarUrl AS avatarUrl, "
            + "u.featuredBadge AS featuredBadge, "
            + "COALESCE(SUM(p.points), 0) AS totalPoints, "
            + "COUNT(p) AS totalPredictions "
            + "FROM Prediction p JOIN p.user u JOIN p.match m "
            + "WHERE p.points IS NOT NULL AND m.utcDate >= :from AND m.utcDate < :to "
            + "GROUP BY u.id, u.email, u.displayName, u.avatarUrl, u.featuredBadge "
            + "ORDER BY totalPoints DESC")
    List<LeaderboardRow> findLeaderboardBetween(@Param("from") java.time.Instant from,
                                                @Param("to") java.time.Instant to);

    interface LeaderboardRow {
        Long getUserId();

        String getEmail();

        /** Co the null (chua dat ten) - tang tren tu thay bang phan truoc dau @. */
        String getDisplayName();

        /** Co the null (chua dat anh) - giao dien ve vong tron chu cai dau. */
        String getAvatarUrl();

        /** Ma huy hieu nguoi choi ghim canh ten. Co the null. */
        String getFeaturedBadge();

        Long getTotalPoints();

        Long getTotalPredictions();
    }
}
