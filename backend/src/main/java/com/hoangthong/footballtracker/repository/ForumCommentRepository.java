package com.hoangthong.footballtracker.repository;

import com.hoangthong.footballtracker.entity.ForumComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface ForumCommentRepository extends JpaRepository<ForumComment, Long> {

    /**
     * Binh luan cua NHIEU bai trong mot truy van.
     *
     * Lay tung bai mot thi 20 bai la 20 truy van (van de N+1) - cham va vo ich khi
     * chi can hien vai binh luan dau moi bai.
     */
    @Query("""
            SELECT c FROM ForumComment c
            JOIN FETCH c.author
            WHERE c.post.id IN :postIds
            ORDER BY c.createdAt ASC
            """)
    List<ForumComment> findByPostIds(@Param("postIds") Collection<Long> postIds);

    long countByPostId(Long postId);

    void deleteByPostId(Long postId);
}
