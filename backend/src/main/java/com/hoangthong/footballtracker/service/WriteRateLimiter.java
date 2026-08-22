package com.hoangthong.footballtracker.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;

/**
 * Chan spam cho cac endpoint GHI khi da dang nhap (dang bai, binh luan, du doan, ket ban).
 *
 * Khac voi rate-limit o AuthController (chan theo email VA dia chi IP de bao ve han muc
 * gui email Brevo), o day chi can chan theo EMAIL: nguoi goi da dang nhap nen email lay
 * tu token, khong gia mao duoc. Muon lach bang nhieu tai khoan thi vuong ngay o cho dang
 * ky - REGISTER_PER_IP da gioi han 5 tai khoan/gio moi IP.
 *
 * Muc dich la chan script goi hang nghin lan/giay lam day o dia Neon va ngap dien dan,
 * khong phai bo dem chinh xac tung request. Dung chung {@link RateLimiterService} (cua so
 * co dinh, dem trong bo nho).
 */
@Component
public class WriteRateLimiter {

    private final RateLimiterService rateLimiter;

    public WriteRateLimiter(RateLimiterService rateLimiter) {
        this.rateLimiter = rateLimiter;
    }

    /**
     * @param action ten hanh dong, ghep vao khoa de moi loai co bo dem rieng (dang bai
     *               nhieu khong an vao han muc binh luan)
     * @param email  nguoi dang goi, lay tu token
     * @throws ResponseStatusException 429 kem ma "rate_limited" (frontend doi sang cau
     *                                 tieng nguoi dung) khi vuot nguong
     */
    public void check(String action, String email, int max, Duration window) {
        if (!rateLimiter.tryConsume(action + ":" + email, max, window)) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "rate_limited");
        }
    }
}
