package com.hoangthong.footballtracker.repository;

import com.hoangthong.footballtracker.entity.RoomMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RoomMessageRepository extends JpaRepository<RoomMessage, Long> {

    /**
     * Tin MOI NHAT truoc, gioi han so luong bang Pageable.
     *
     * Lay nguoc roi dao lai o tang tren, chu khong lay tu cu den moi: phong chat vai
     * thang se co hang nghin tin, doc het chi de lay 50 tin cuoi la lang phi.
     */
    @Query("""
            SELECT m FROM RoomMessage m
            JOIN FETCH m.author
            WHERE m.league.id = :leagueId
            ORDER BY m.createdAt DESC
            """)
    List<RoomMessage> findLatest(@Param("leagueId") Long leagueId, Pageable pageable);
}
