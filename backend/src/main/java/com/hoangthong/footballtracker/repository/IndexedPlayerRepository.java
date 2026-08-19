package com.hoangthong.footballtracker.repository;

import com.hoangthong.footballtracker.entity.IndexedPlayer;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface IndexedPlayerRepository extends JpaRepository<IndexedPlayer, Long> {

    List<IndexedPlayer> findByTeamId(Long teamId);

    /**
     * Khop tu bat ky dau trong ten (LIKE %q%), khong chi dau ten - nguoi ta quen go
     * ho hoac ten rieng chu it khi go du ca chuoi.
     */
    /*
     * Tach hai truy van thay vi dung mot cai co ":league IS NULL OR ...".
     * Postgres khong suy duoc kieu cua tham so khi no chi xuat hien trong phep so sanh
     * voi NULL -> loi "could not determine data type of parameter" NGAY LUC CHAY,
     * ma test don khong bat duoc vi khong dung database that.
     *
     * Sap xep: khop tu dau ten len truoc, roi den ten ngan hon. Go "mar" thi
     * "Marcus Rashford" phai dung tren "Emiliano Martinez".
     */
    @Query("""
            SELECT p FROM IndexedPlayer p
            WHERE p.nameNormalized LIKE CONCAT('%', :q, '%')
            ORDER BY
              CASE WHEN p.nameNormalized LIKE CONCAT(:q, '%') THEN 0 ELSE 1 END,
              LENGTH(p.name),
              p.name
            """)
    List<IndexedPlayer> searchAll(@Param("q") String q, Pageable pageable);

    @Query("""
            SELECT p FROM IndexedPlayer p
            WHERE p.nameNormalized LIKE CONCAT('%', :q, '%')
              AND p.leagueCode = :league
            ORDER BY
              CASE WHEN p.nameNormalized LIKE CONCAT(:q, '%') THEN 0 ELSE 1 END,
              LENGTH(p.name),
              p.name
            """)
    List<IndexedPlayer> searchInLeague(@Param("q") String q, @Param("league") String league, Pageable pageable);

    /** Doi da co trong chi muc chua - dung de biet con doi nao chua lam. */
    @Query("SELECT DISTINCT p.teamId FROM IndexedPlayer p WHERE p.leagueCode = :league")
    List<Long> findIndexedTeamIds(@Param("league") String league);

    long countByLeagueCode(String leagueCode);
}
