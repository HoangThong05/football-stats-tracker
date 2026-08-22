package com.hoangthong.footballtracker.repository;

import com.hoangthong.footballtracker.entity.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
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
     * So luot thich moi vao bai cua nguoi xem, khong tinh luot chinh ho bam.
     *
     * createdAt null (luot thich co truoc khi them cot nay) khong bao gio thoa
     * "> :since" nen khong bi dem nguoc ve qua khu.
     */
    @Query("""
            SELECT COUNT(l) FROM PostLike l
            WHERE l.createdAt > :since
              AND l.user.id <> :viewerId
              AND l.post.author.id = :viewerId
            """)
    long countNewForViewer(@Param("since") Instant since,
                           @Param("viewerId") Long viewerId);

    void deleteByPostId(Long postId);
}
