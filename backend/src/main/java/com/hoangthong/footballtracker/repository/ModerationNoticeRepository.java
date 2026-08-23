package com.hoangthong.footballtracker.repository;

import com.hoangthong.footballtracker.entity.ModerationNotice;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface ModerationNoticeRepository extends JpaRepository<ModerationNotice, Long> {

    /** Thong bao go bai/cmt gui den mot nguoi, moi nhat truoc. Nguon cho chuong. */
    @Query("""
            SELECT n FROM ModerationNotice n
            WHERE n.recipient.id = :userId
              AND n.createdAt > :since
            ORDER BY n.createdAt DESC
            """)
    List<ModerationNotice> findForRecipient(@Param("userId") Long userId,
                                            @Param("since") Instant since,
                                            Pageable pageable);
}
