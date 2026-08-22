package com.hoangthong.footballtracker.service;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/**
 * Loc duong dan anh nguoi dung gui len.
 *
 * Anh KHONG di qua backend (trinh duyet tai thang len Cloudinary - xem cloudinary.js),
 * nen thu duy nhat backend nhan duoc la mot chuoi URL. Khong loc thi ai cung dat duoc
 * URL bat ky vao day: bai viet va anh dai dien thanh cho gan link di noi khac, va "anh"
 * co the la bat cu thu gi tren mang.
 */
public final class ImageUrl {

    /** Chi anh nam tren Cloudinary moi duoc nhan. */
    private static final String CLOUDINARY_PREFIX = "https://res.cloudinary.com/";

    /**
     * Bang do dai cot trong CSDL (app_user.avatar_url va forum_post.image_url).
     * URL Cloudinary that dai khoang 100 ky tu, nen 500 la rong rai.
     */
    public static final int MAX_LENGTH = 500;

    private ImageUrl() {
    }

    /**
     * @return duong dan da cat khoang trang, hoac null neu khong co anh
     * @throws ResponseStatusException 400 neu duong dan khong phai anh Cloudinary
     */
    public static String clean(String url) {
        if (url == null || url.isBlank()) {
            return null;
        }
        String trimmed = url.trim();
        if (!trimmed.startsWith(CLOUDINARY_PREFIX) || trimmed.length() > MAX_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "image_url_invalid");
        }
        return trimmed;
    }
}
