package com.hoangthong.footballtracker.dto;

import java.time.Instant;
import java.util.List;

public class ForumDto {

    /** Mot binh luan. */
    /** parentId null = binh luan goc; co gia tri = tra loi cho binh luan do. */
    public record Comment(long id, Long parentId, long authorId, String authorName,
                          /** Anh dai dien cua nguoi viet. null = chua dat. */
                          String authorAvatar,
                          /** true = nguoi viet la ADMIN -> hien huy hieu ADMIN canh ten. */
                          boolean authorIsAdmin,
                          String content, Instant createdAt,
                          /** Lan sua gan nhat. null = chua sua -> khong hien nhan "da chinh sua". */
                          Instant editedAt,
                          /** true = nguoi xem con trong han sua binh luan nay. */
                          boolean canEdit,
                          /** true = nguoi xem con trong han xoa, hoac la admin. */
                          boolean canDelete) {}

    /**
     * Mot bai viet kem moi thu can de hien: so thich, minh da thich chua, binh luan.
     *
     * Gop het vao mot lan tra ve thay vi de frontend goi them cho tung bai - 20 bai ma
     * moi bai mot request nua thi trang tai rat cham.
     */
    public record Post(
            long id,
            long authorId,
            String authorName,
            /** Anh dai dien cua nguoi viet. null = chua dat. */
            String authorAvatar,
            /** true = nguoi viet la ADMIN -> hien huy hieu ADMIN canh ten. */
            boolean authorIsAdmin,
            String content,
            String imageUrl,
            Instant createdAt,
            /** Lan sua gan nhat. null = chua sua -> khong hien nhan "da chinh sua". */
            Instant editedAt,
            long likeCount,
            boolean likedByMe,
            /** true = nguoi xem con trong han sua bai nay. */
            boolean canEdit,
            /** true = nguoi xem con trong han xoa, hoac la admin. */
            boolean canDelete,
            List<Comment> comments
    ) {}

    /**
     * Mot dong trong chuong thong bao: ai do vua dong vao bai/binh luan cua nguoi xem.
     *
     * Khong co bang thong bao rieng trong CSDL - moi dong day duoc suy ra tu chinh
     * binh luan va luot thich da co. Them mot bang nua thi phai ghi vao do moi lan co
     * hoat dong, roi phai don khi bai bi xoa; suy ra luc doc thi khong bao gio lech.
     */
    public record Notification(
            /** COMMENT = binh luan vao bai minh; REPLY = tra loi binh luan minh; LIKE = thich bai minh. */
            String kind,
            long postId,
            long actorId,
            String actorName,
            String actorAvatar,
            /** Trich ngan de nhan ra dang noi ve bai nao. */
            String excerpt,
            Instant createdAt
    ) {}

    public record CreatePostRequest(String content, String imageUrl) {}

    public record CommentRequest(String content, Long parentId) {}

    /** Dung chung cho sua bai va sua binh luan - ca hai chi doi phan chu. */
    public record EditRequest(String content) {}

    public record ReportRequest(String reason) {}
}
