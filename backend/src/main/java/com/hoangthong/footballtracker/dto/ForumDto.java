package com.hoangthong.footballtracker.dto;

import java.time.Instant;
import java.util.List;

public class ForumDto {

    /** Mot binh luan. */
    /** parentId null = binh luan goc; co gia tri = tra loi cho binh luan do. */
    public record Comment(long id, Long parentId, long authorId, String authorName,
                          /** Anh dai dien cua nguoi viet. null = chua dat. */
                          String authorAvatar,
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

    public record CreatePostRequest(String content, String imageUrl) {}

    public record CommentRequest(String content, Long parentId) {}

    /** Dung chung cho sua bai va sua binh luan - ca hai chi doi phan chu. */
    public record EditRequest(String content) {}

    public record ReportRequest(String reason) {}
}
