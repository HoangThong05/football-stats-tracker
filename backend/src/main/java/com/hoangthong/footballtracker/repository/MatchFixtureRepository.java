package com.hoangthong.footballtracker.repository;

import com.hoangthong.footballtracker.entity.MatchFixture;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface MatchFixtureRepository extends JpaRepository<MatchFixture, Long> {

    /**
     * Cac tran sap dien ra (status SCHEDULED/TIMED) trong khoang thoi gian,
     * dung de doi chieu doi yeu thich va gui thong bao.
     */
    List<MatchFixture> findByStatusInAndUtcDateBetween(
            List<String> statuses, Instant from, Instant to);

    /** Cac tran sap dien ra cua 1 giai, sap xep gan nhat truoc -> dung cho man hinh du doan. */
    List<MatchFixture> findByCompetitionAndStatusInOrderByUtcDateAsc(String competition, List<String> statuses);

    /** Tran da ket thuc, dung cho job cham diem du doan. */
    List<MatchFixture> findByStatus(String status);
}
