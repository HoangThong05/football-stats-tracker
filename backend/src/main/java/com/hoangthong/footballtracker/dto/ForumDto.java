package com.hoangthong.footballtracker.dto;

import java.time.Instant;
import java.util.List;

public class ForumDto {

    /** Mot binh luan. */
    public record Comment(long id, long authorId, String authorName, String content, Instant createdAt) {}

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
            String content,
            String imageUrl,
            Instant createdAt,
            long likeCount,
            boolean likedByMe,
            /** true = bai cua chinh minh, hoac minh la admin -> duoc xoa. */
            boolean canDelete,
            List<Comment> comments
    ) {}

    public record CreatePostRequest(String content, String imageUrl) {}

    public record CommentRequest(String content) {}

    public record ReportRequest(String reason) {}
}
