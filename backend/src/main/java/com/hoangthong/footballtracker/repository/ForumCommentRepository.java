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
     * Binh luan CO DINH DEN nguoi xem, moi nhat truoc: nguoi khac binh luan vao bai cua
     * ho, hoac tra loi mot binh luan cua ho. Nguon cho chuong thong bao.
     *
     * LEFT JOIN c.parent la bat buoc: viet thang "c.parent.author.id" thi JPQL tu sinh
     * INNER JOIN, va moi binh luan GOC (parent = null) bi loai khoi ket qua - ke ca binh
     * luan goc nam ngay tren bai cua nguoi xem.
     *
     * FETCH het cac quan he se doc toi: khong co chung thi moi dong lai sinh them mot
     * truy van rieng de lay ten va anh nguoi viet.
     */
    @Query("""
            SELECT c FROM ForumComment c
            JOIN FETCH c.author
            JOIN FETCH c.post p
            JOIN FETCH p.author
            LEFT JOIN FETCH c.parent parent
            LEFT JOIN FETCH parent.author
            WHERE c.author.id <> :viewerId
              AND p.hidden = false
              AND (p.author.id = :viewerId OR parent.author.id = :viewerId)
            ORDER BY c.createdAt DESC
            """)
    List<ForumComment> findForViewer(@Param("viewerId") Long viewerId,
                                     org.springframework.data.domain.Pageable pageable);

    void deleteByPostId(Long postId);

    /** Cac tra loi cua mot binh luan goc - xoa binh luan goc phai keo theo chung. */
    void deleteByParentId(Long parentId);
}
