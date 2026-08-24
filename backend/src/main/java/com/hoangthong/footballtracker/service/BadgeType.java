package com.hoangthong.footballtracker.service;

/**
 * Danh muc huy hieu thanh tich du doan. threshold: nguong can dat de mo khoa.
 *
 * Moi loai gan voi MOT chi so tinh tu lich su du doan (xem BadgeService):
 *  - ROOKIE / SHARP: so lan du doan CO DIEM (dung ket qua tro len).
 *  - PROPHET / ORACLE: so lan du doan DUNG CHINH XAC ti so.
 *  - WIN_STREAK / ON_FIRE: chuoi dai nhat cac lan lien tiep co diem > 0.
 *  - CENTURION: tong diem tich luy.
 *  - WEEKLY_KING: so lan vo dich tuan.
 *
 * Xep tu de den kho de nguoi moi som co huy hieu dau tien (ROOKIE), va van con
 * muc tieu dai hoi (ORACLE, WEEKLY_KING).
 */
public enum BadgeType {
    ROOKIE(1),
    SHARP(25),
    PROPHET(10),
    ORACLE(25),
    WIN_STREAK(5),
    ON_FIRE(10),
    CENTURION(100),
    WEEKLY_KING(3);

    private final int threshold;

    BadgeType(int threshold) {
        this.threshold = threshold;
    }

    public int getThreshold() {
        return threshold;
    }

    /**
     * Bieu tuong + ten tieng Viet - de soan noi dung thong bao "dat huy hieu" o may chu
     * (push/chuong). Phai khop BADGE_META va i18n ben frontend.
     */
    public String emoji() {
        return switch (this) {
            case ROOKIE -> "🐣";
            case SHARP -> "🎯";
            case PROPHET -> "🔮";
            case ORACLE -> "🧿";
            case WIN_STREAK -> "🔥";
            case ON_FIRE -> "🌋";
            case CENTURION -> "💯";
            case WEEKLY_KING -> "👑";
        };
    }

    public String title() {
        return switch (this) {
            case ROOKIE -> "Chào sân";
            case SHARP -> "Nhắm chuẩn";
            case PROPHET -> "Nhà tiên tri";
            case ORACLE -> "Tiên tri đại tài";
            case WIN_STREAK -> "Chuỗi thắng";
            case ON_FIRE -> "Rực cháy";
            case CENTURION -> "Trăm điểm";
            case WEEKLY_KING -> "Vua theo tuần";
        };
    }
}
