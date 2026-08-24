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
        /** true = tai khoan quan tri -> ho so hien gon, khong co phan nguoi choi. */
        boolean isAdmin,
        /** Anh dai dien tren Cloudinary. null = chua dat, giao dien ve vong tron chu cai. */
        String avatarUrl,
        /** Anh bia (banner). null = chua dat -> giao dien ve vach san co mac dinh. */
        String coverUrl,
        String joinedAt,
        long totalPoints,
        long totalPredictions,
        long exactScores,
        /** % du doan CO DIEM (gom ca dung ket qua), 0-100. */
        int hitRate,
        /** So ban be. Chi con so, KHONG kem danh sach ten - tranh lo quan he. */
        long friendsCount,
        /** Doi dang theo doi. */
        List<FavoriteTeamDto> favorites,
        /** Diem tung du doan da cham, cu -> moi. Frontend cong don ve bieu do. */
        List<Integer> pointsTimeline,
        /** So lan "Nhat tuan" (dan dau BXH du doan mot tuan). */
        long weeklyWins,
        List<BadgeDto> badges,
        /** Quan he voi nguoi DANG XEM: NONE / PENDING_SENT / PENDING_RECEIVED / FRIENDS / SELF. */
        String relation
) {
}
