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

    /** Tong diem du doan cua tung thanh vien trong phong (dung cho BXH). */
    @Query("""
        SELECT lm.user.id, lm.user.email, COALESCE(SUM(p.points), 0)
        FROM LeagueMember lm
        LEFT JOIN Prediction p ON p.user = lm.user AND p.points IS NOT NULL
        WHERE lm.league.id = :leagueId
        GROUP BY lm.user.id, lm.user.email
        ORDER BY COALESCE(SUM(p.points), 0) DESC
        """)
    List<Object[]> findLeaderboard(@Param("leagueId") Long leagueId);
}
