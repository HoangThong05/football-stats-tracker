package com.hoangthong.footballtracker.repository;

import com.hoangthong.footballtracker.entity.LeagueMember;
import com.hoangthong.footballtracker.entity.MiniLeague;
import com.hoangthong.footballtracker.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LeagueMemberRepository extends JpaRepository<LeagueMember, Long> {

    List<LeagueMember> findByUser(User user);

    List<LeagueMember> findByLeague(MiniLeague league);

    Optional<LeagueMember> findByLeagueAndUser(MiniLeague league, User user);

    boolean existsByLeagueAndUser(MiniLeague league, User user);

    /**
     * BXH phong: tong diem, so luot da cham diem, va so lan trung CHINH XAC ti so (3 diem).
     *
     * Chi co tong diem thi khong phan biet duoc nguoi doan nhieu ma trung it voi nguoi
     * doan it ma trung nhieu - hai kieu choi khac han nhau.
     */
    @Query("""
        SELECT lm.user.id,
               lm.user.email,
               lm.user.displayName,
               COALESCE(SUM(p.points), 0),
               COUNT(p),
               COALESCE(SUM(CASE WHEN p.points = 3 THEN 1 ELSE 0 END), 0)
        FROM LeagueMember lm
        LEFT JOIN Prediction p ON p.user = lm.user AND p.points IS NOT NULL
        WHERE lm.league.id = :leagueId
        GROUP BY lm.user.id, lm.user.email, lm.user.displayName
        ORDER BY COALESCE(SUM(p.points), 0) DESC
        """)
    List<Object[]> findLeaderboard(@Param("leagueId") Long leagueId);
}
