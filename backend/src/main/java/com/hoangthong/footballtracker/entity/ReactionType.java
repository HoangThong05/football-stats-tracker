package com.hoangthong.footballtracker.entity;

/**
 * Loai cam xuc kieu Facebook. Chi luu TEN o backend; bieu tuong (emoji) va nhan hien thi
 * nam o frontend (constants + i18n).
 *
 * Them loai moi thi chi can them o day va o frontend - du lieu cu khong anh huong.
 */
public enum ReactionType {
    LIKE, LOVE, HAHA, WOW, SAD, ANGRY;

    /**
     * Bieu tuong cho thong bao day (chay o may chu nen can emoji o day, khong lay tu
     * frontend duoc). Phai khop bang REACTION_EMOJI ben frontend.
     */
    public String emoji() {
        return switch (this) {
            case LIKE -> "👍";
            case LOVE -> "❤️";
            case HAHA -> "😆";
            case WOW -> "😮";
            case SAD -> "😢";
            case ANGRY -> "😡";
        };
    }

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
