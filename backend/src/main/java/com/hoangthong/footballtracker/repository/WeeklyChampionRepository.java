package com.hoangthong.footballtracker.repository;

import com.hoangthong.footballtracker.entity.WeeklyChampion;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface WeeklyChampionRepository extends JpaRepository<WeeklyChampion, Long> {

    /** Tuan nay da trao chua? (tranh trao lai moi lan job chay). */
    boolean existsByWeekStart(Instant weekStart);

    /** Cac lan Nhat tuan cua mot nguoi, moi nhat truoc - cho chuong va ho so. */
    List<WeeklyChampion> findByUserIdOrderByWeekStartDesc(long userId, Pageable pageable);

    /** So lan Nhat tuan - cho huy hieu tren ho so. */
    long countByUserId(long userId);
}
