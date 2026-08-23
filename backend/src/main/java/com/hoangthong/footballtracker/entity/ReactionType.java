package com.hoangthong.footballtracker.entity;

/**
 * Loai cam xuc kieu Facebook. Chi luu TEN o backend; bieu tuong (emoji) va nhan hien thi
 * nam o frontend (constants + i18n).
 *
 * Them loai moi thi chi can them o day va o frontend - du lieu cu khong anh huong.
 */
public enum ReactionType {
    LIKE, LOVE, HAHA, WOW, SAD, ANGRY;

    /** Chuyen chuoi tu client thanh enum; sai/thieu -> LIKE (an toan, khong nem loi). */
    public static ReactionType fromString(String s) {
        if (s == null) {
            return LIKE;
        }
        try {
            return valueOf(s.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return LIKE;
        }
    }
}
