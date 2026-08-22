package com.hoangthong.footballtracker.dto;

import java.util.List;

/**
 * Ho so cong khai cua mot nguoi choi - ai cung xem duoc.
 *
 * TUYET DOI khong dua email vao day. Bang xep hang du doan la trang cong khai, va day
 * la trang mo tu do - lo email o day thi moi cong suc thay email bang ten hien thi
 * o cac bang kia thanh vo nghia.
 */
public record PublicProfileDto(
        long id,
        String name,
        /** Anh dai dien tren Cloudinary. null = chua dat, giao dien ve vong tron chu cai. */
        String avatarUrl,
        String joinedAt,
        long totalPoints,
        long totalPredictions,
        long exactScores,
        List<BadgeDto> badges,
        /** Quan he voi nguoi DANG XEM: NONE / PENDING_SENT / PENDING_RECEIVED / FRIENDS / SELF. */
        String relation
) {
}
