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

    /**
     * Moi tran cua MOI giai trong khoang thoi gian, tran som nhat truoc.
     * Dung cho trang "Hom nay": doc thang tu DB (da duoc MatchSyncService dong bo
     * dinh ky) nen KHONG ton request nao toi football-data.org.
     */
    List<MatchFixture> findByUtcDateBetweenOrderByUtcDateAsc(Instant from, Instant to);

    /**
     * Cac giai DANG co tran lan banh, de dong bo day hon rieng cho chung.
     *
     * Loc theo GIO BONG LAN chu khong theo status IN_PLAY: status trong DB cung chi
     * duoc cap nhat sau moi lan dong bo, nen doi no chuyen sang IN_PLAY roi moi dong bo
     * day len la tu khoa minh lai - khong bao gio thoat ra duoc.
     */
    @org.springframework.data.jpa.repository.Query("""
            SELECT DISTINCT m.competition FROM MatchFixture m
            WHERE m.status IN :statuses
              AND m.utcDate BETWEEN :from AND :to
            """)
    List<String> findCompetitionsWithMatchesAround(
            @org.springframework.data.repository.query.Param("statuses") List<String> statuses,
            @org.springframework.data.repository.query.Param("from") Instant from,
            @org.springframework.data.repository.query.Param("to") Instant to);
}
