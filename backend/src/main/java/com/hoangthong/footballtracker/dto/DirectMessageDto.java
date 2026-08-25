package com.hoangthong.footballtracker.dto;

import java.time.Instant;

public class DirectMessageDto {

    /**
     * Mot tin trong hoi thoai.
     *
     * @param mine   true = tin do CHINH nguoi xem gui (canh phai, mau khac)
     * @param readAt luc nguoi kia doc - chi co y nghia voi tin CUA MINH ("Da xem")
     */
    public record Message(long id, boolean mine, String content, String imageUrl,
                          Instant createdAt, Instant readAt) {}

    /**
     * Mot dong trong danh sach hoi thoai (hop thu).
     *
     * @param lastFromMe true = tin cuoi do minh gui -> hien "Ban: ..."
     * @param unread     so tin chua doc tu nguoi nay
     */
    public record Conversation(long userId, String name, String avatarUrl, String featuredBadge,
                               String lastContent, boolean lastHasImage, boolean lastFromMe,
                               Instant lastAt, long unread) {}
}
