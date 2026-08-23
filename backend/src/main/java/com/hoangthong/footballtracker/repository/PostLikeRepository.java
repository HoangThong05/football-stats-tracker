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

    /** Dem cam xuc theo LOAI cho nhieu bai: [postId, ReactionType (co the null=cu), count]. */
    @Query("SELECT l.post.id, l.type, COUNT(l) FROM PostLike l WHERE l.post.id IN :postIds "
            + "GROUP BY l.post.id, l.type")
    List<Object[]> countByTypePerPost(@Param("postIds") Collection<Long> postIds);

    /** Cam xuc cua NGUOI NAY tren cac bai: [postId, ReactionType]. */
    @Query("SELECT l.post.id, l.type FROM PostLike l WHERE l.user.id = :userId AND l.post.id IN :postIds")
    List<Object[]> findMyReactions(@Param("userId") Long userId, @Param("postIds") Collection<Long> postIds);

    /**
     * Cam xuc vao bai cua nguoi xem, moi nhat truoc. Nguon cho chuong thong bao.
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

    /**
     * Ai da tha cam xuc vao mot bai, moi nhat truoc - cho danh sach "ai da tha".
     *
     * NULLS LAST: cac luot thich cu (truoc khi co cot createdAt) khong biet luc nao nen
     * day xuong cuoi, khong chen len tren nhung luot moi that.
     */
    @Query("""
            SELECT l FROM PostLike l
            JOIN FETCH l.user
            WHERE l.post.id = :postId
            ORDER BY l.createdAt DESC NULLS LAST
            """)
    List<PostLike> findReactorsByPostId(@Param("postId") Long postId);

    void deleteByPostId(Long postId);
}
