package com.hoangthong.footballtracker.repository;

import com.hoangthong.footballtracker.entity.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface PostLikeRepository extends JpaRepository<PostLike, Long> {

    Optional<PostLike> findByPostIdAndUserId(Long postId, Long userId);

    /** So luot thich cua nhieu bai cung luc: [postId, count]. */
    @Query("SELECT l.post.id, COUNT(l) FROM PostLike l WHERE l.post.id IN :postIds GROUP BY l.post.id")
    List<Object[]> countByPostIds(@Param("postIds") Collection<Long> postIds);

    /** Cac bai ma NGUOI NAY da thich - de to sang nut thich. */
    @Query("SELECT l.post.id FROM PostLike l WHERE l.user.id = :userId AND l.post.id IN :postIds")
    List<Long> findLikedPostIds(@Param("userId") Long userId, @Param("postIds") Collection<Long> postIds);

    /**
     * Luot thich vao bai cua nguoi xem, moi nhat truoc. Nguon cho chuong thong bao.
     *
     * Loai bo createdAt null - do la cac luot thich co TRUOC khi cot nay ton tai, khong
     * biet chung xay ra luc nao nen khong xep duoc vao dong thoi gian.
     */
    @Query("""
            SELECT l FROM PostLike l
            JOIN FETCH l.user
            JOIN FETCH l.post p
            JOIN FETCH p.author
            WHERE l.user.id <> :viewerId
              AND p.author.id = :viewerId
              AND p.hidden = false
              AND l.createdAt IS NOT NULL
            ORDER BY l.createdAt DESC
            """)
    List<PostLike> findForViewer(@Param("viewerId") Long viewerId,
                                 org.springframework.data.domain.Pageable pageable);

    void deleteByPostId(Long postId);
}
