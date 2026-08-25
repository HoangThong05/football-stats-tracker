package com.hoangthong.footballtracker.dto;

import java.time.Instant;
import java.util.List;

public class DirectMessageDto {

    /**
     * Mot tin trong hoi thoai.
     *
     * @param mine        true = tin do CHINH nguoi xem gui (canh phai, mau khac)
     * @param readAt      luc nguoi kia doc - chi co y nghia voi tin CUA MINH ("Da xem")
     * @param reactions   cac loai cam xuc dang co tren tin (0-2 cai, tu hai nguoi)
     * @param myReaction  cam xuc CUA NGUOI XEM tren tin nay, null = chua tha
     * @param replyToId   tin dang tra loi, null = tin thuong
     * @param replyToText trich ngan tin duoc tra loi (chu hoac "📷 Ảnh")
     * @param replyToMine true = tin duoc tra loi la cua nguoi xem
     */
    public record Message(long id, boolean mine, String content, String imageUrl,
                          Instant createdAt, Instant readAt,
                          List<String> reactions, String myReaction,
                          Long replyToId, String replyToText, boolean replyToMine,
                          /** true = da thu hoi voi moi nguoi -> hien "Tin nhan da thu hoi". */
                          boolean recalled,
                          /** true = tin da ghim. */
                          boolean pinned) {}

    /**
     * Mot dong trong danh sach hoi thoai (hop thu).
     *
     * @param lastFromMe true = tin cuoi do minh gui -> hien "Ban: ..."
     * @param unread     so tin chua doc tu nguoi nay
     */
    public record Conversation(long userId, String name, String avatarUrl, String featuredBadge,
                               String lastContent, boolean lastHasImage, boolean lastFromMe,
                               Instant lastAt, long unread,
                               /** true = da ghim hoi thoai (len dau danh sach). */
                               boolean pinned,
                               /** true = da tat thong bao hoi thoai nay. */
                               boolean muted) {}
}
