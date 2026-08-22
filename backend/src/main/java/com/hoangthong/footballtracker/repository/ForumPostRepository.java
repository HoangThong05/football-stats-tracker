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

    /** Ke ca bai da an - chi dung cho trang quan tri. */
    @Query("""
            SELECT p FROM ForumPost p
            JOIN FETCH p.author
            ORDER BY p.createdAt DESC
            """)
    List<ForumPost> findAllForAdmin(Pageable pageable);
}
