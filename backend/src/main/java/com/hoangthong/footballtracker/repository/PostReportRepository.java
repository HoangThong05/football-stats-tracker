package com.hoangthong.footballtracker.repository;

import com.hoangthong.footballtracker.entity.PostReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PostReportRepository extends JpaRepository<PostReport, Long> {

    boolean existsByPostIdAndReporterId(Long postId, Long reporterId);

    /** Bai bi bao cao, nhieu bao cao nhat len truoc - danh sach viec cho admin. */
    @Query("""
            SELECT r.post.id, COUNT(r) FROM PostReport r
            WHERE r.post.hidden = false
            GROUP BY r.post.id
            ORDER BY COUNT(r) DESC
            """)
    List<Object[]> countPendingByPost();

    void deleteByPostId(Long postId);
}
