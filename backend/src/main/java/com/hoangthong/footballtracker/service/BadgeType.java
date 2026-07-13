package com.hoangthong.footballtracker.service;

/**
 * Danh muc huy hieu thanh tich du doan. threshold: nguong can dat de mo khoa.
 * PROPHET: tong so lan doan DUNG CHINH XAC ti so (diem = 3), tinh moi luc.
 * WIN_STREAK: chuoi dai nhat cac lan du doan LIEN TIEP (theo thoi gian tran) co diem > 0.
 */
public enum BadgeType {
    PROPHET(10),
    WIN_STREAK(5);

    private final int threshold;

    BadgeType(int threshold) {
        this.threshold = threshold;
    }

    public int getThreshold() {
        return threshold;
    }
}
