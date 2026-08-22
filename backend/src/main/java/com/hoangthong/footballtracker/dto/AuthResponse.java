package com.hoangthong.footballtracker.dto;

/**
 * @param hasPassword false = tai khoan chua bao gio tu dat mat khau (tao bang Google).
 * @param viaGoogle   true = PHIEN NAY dang nhap bang nut Google, khong phai bang mat khau.
 *                    Man doi mat khau dua vao day de biet co hoi "mat khau hien tai" khong -
 *                    hoi theo kieu tai khoan la sai, vi mot tai khoan co the dang nhap
 *                    duoc ca hai duong.
 */
public record AuthResponse(long userId, String token, String email, String role,
                           boolean hasPassword, boolean viaGoogle,
                           /** Ten hien ra cho nguoi khac. Chua dat thi la phan truoc dau @. */
                           String displayName) {
}
