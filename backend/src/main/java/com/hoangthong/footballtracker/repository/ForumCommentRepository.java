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
            LEFT JOIN FETCH c.parent
            WHERE c.post.id IN :postIds
            ORDER BY c.createdAt ASC
            """)
    List<ForumComment> findByPostIds(@Param("postIds") Collection<Long> postIds);

    long countByPostId(Long postId);

    /**
     * So binh luan moi CO DINH DEN nguoi xem: nguoi khac binh luan vao bai cua ho, hoac
     * tra loi mot binh luan cua ho.
     *
     * Truoc day dem MOI binh luan moi cua ca dien dan, nen nguoi A binh luan vao bai cua
     * nguoi B cung lam noi so do tren tab Cong dong cua nguoi C - mot thong bao ma nguoi
     * nhan khong lien quan gi.
     *
     * LEFT JOIN c.parent la bat buoc: viet thang "c.parent.author.id" thi JPQL tu sinh
     * INNER JOIN, va moi binh luan GOC (parent = null) bi loai khoi ket qua - ke ca binh
     * luan goc nam ngay tren bai cua nguoi xem.
     */
    @Query("""
            SELECT COUNT(c) FROM ForumComment c
            LEFT JOIN c.parent parent
            WHERE c.createdAt > :since
              AND c.author.id <> :viewerId
              AND (c.post.author.id = :viewerId OR parent.author.id = :viewerId)
            """)
    long countNewForViewer(@Param("since") java.time.Instant since,
                           @Param("viewerId") Long viewerId);

    void deleteByPostId(Long postId);

    /** Cac tra loi cua mot binh luan goc - xoa binh luan goc phai keo theo chung. */
    void deleteByParentId(Long parentId);
}
