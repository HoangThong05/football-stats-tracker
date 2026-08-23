package com.hoangthong.footballtracker.repository;

import com.hoangthong.footballtracker.entity.CommentReaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CommentReactionRepository extends JpaRepository<CommentReaction, Long> {

    Optional<CommentReaction> findByCommentIdAndUserId(Long commentId, Long userId);

    /** Dem cam xuc theo LOAI cho nhieu binh luan: [commentId, ReactionType, count]. */
    @Query("SELECT r.comment.id, r.type, COUNT(r) FROM CommentReaction r WHERE r.comment.id IN :commentIds "
            + "GROUP BY r.comment.id, r.type")
    List<Object[]> countByTypePerComment(@Param("commentIds") Collection<Long> commentIds);

    /** Cam xuc cua NGUOI NAY tren cac binh luan: [commentId, ReactionType]. */
    @Query("SELECT r.comment.id, r.type FROM CommentReaction r WHERE r.user.id = :userId AND r.comment.id IN :commentIds")
    List<Object[]> findMyReactions(@Param("userId") Long userId, @Param("commentIds") Collection<Long> commentIds);

    /** Cam xuc vao binh luan cua nguoi xem, moi nhat truoc. Nguon cho chuong thong bao. */
    @Query("""
            SELECT r FROM CommentReaction r
            JOIN FETCH r.user
            JOIN FETCH r.comment c
            JOIN FETCH c.author
            JOIN FETCH c.post p
            WHERE r.user.id <> :viewerId
              AND c.author.id = :viewerId
              AND p.hidden = false
            ORDER BY r.createdAt DESC
            """)
    List<CommentReaction> findForViewer(@Param("viewerId") Long viewerId,
                                        org.springframework.data.domain.Pageable pageable);

    /** Xoa cam xuc cua mot binh luan VA cac tra loi cua no - khi xoa binh luan goc. */
    @Modifying
    @Query("DELETE FROM CommentReaction r WHERE r.comment.id = :commentId OR r.comment.parent.id = :commentId")
    void deleteByCommentOrParent(@Param("commentId") Long commentId);

    /** Xoa moi cam xuc cua binh luan thuoc mot bai - khi xoa ca bai. */
    @Modifying
    @Query("DELETE FROM CommentReaction r WHERE r.comment.id IN (SELECT c.id FROM ForumComment c WHERE c.post.id = :postId)")
    void deleteByPostId(@Param("postId") Long postId);
}
