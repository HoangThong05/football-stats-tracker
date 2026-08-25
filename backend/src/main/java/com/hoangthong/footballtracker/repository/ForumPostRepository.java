package com.hoangthong.footballtracker.repository;

import com.hoangthong.footballtracker.entity.ForumPost;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ForumPostRepository extends JpaRepository<ForumPost, Long> {

    /** Bai moi truoc, BO QUA bai da bi an. Phan trang bang Pageable. */
    @Query("""
            SELECT p FROM ForumPost p
            JOIN FETCH p.author
            WHERE p.hidden = false
            ORDER BY p.createdAt DESC
            """)
    List<ForumPost> findVisible(Pageable pageable);

    /**
     * Bai viet NHAC den nguoi xem (@) - do nguoi khac viet, chua bi an.
     * pattern la '%(uid:&lt;id&gt;)%' - phan dac trung cua token @[Ten](uid:ID).
     */
    @Query("""
            SELECT p FROM ForumPost p
            JOIN FETCH p.author
            WHERE p.hidden = false
              AND p.author.id <> :viewerId
              AND p.content LIKE :pattern
            ORDER BY p.createdAt DESC
            """)
    List<ForumPost> findMentioning(@org.springframework.data.repository.query.Param("viewerId") long viewerId,
                                   @org.springframework.data.repository.query.Param("pattern") String pattern,
                                   Pageable pageable);

    /** So bai moi ke tu moc thoi gian, khong tinh bai cua chinh nguoi xem. */
    @org.springframework.data.jpa.repository.Query("""
            SELECT COUNT(p) FROM ForumPost p
            WHERE p.hidden = false
              AND p.createdAt > :since
              AND (:viewerId IS NULL OR p.author.id <> :viewerId)
            """)
    long countNewSince(@org.springframework.data.repository.query.Param("since") java.time.Instant since,
                       @org.springframework.data.repository.query.Param("viewerId") Long viewerId);

    /** Ke ca bai da an - chi dung cho trang quan tri. */
    @Query("""
            SELECT p FROM ForumPost p
            JOIN FETCH p.author
            ORDER BY p.createdAt DESC
            """)
    List<ForumPost> findAllForAdmin(Pageable pageable);
}
