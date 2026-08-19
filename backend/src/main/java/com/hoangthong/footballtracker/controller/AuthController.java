package com.hoangthong.footballtracker.controller;

import com.hoangthong.footballtracker.dto.AuthRequest;
import com.hoangthong.footballtracker.dto.AuthResponse;
import com.hoangthong.footballtracker.service.AuthService;
import com.hoangthong.footballtracker.service.GoogleAuthService;
import com.hoangthong.footballtracker.service.RateLimiterService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;

/**
 * Dang ky / dang nhap, tra ve JWT. Gan token nay vao header
 * "Authorization: Bearer <token>" cho cac API can dang nhap (VD /api/favorites).
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    /*
     * Chan theo CA email LAN dia chi IP.
     * - Theo email: khong cho doi thu vao mot hop thu cu the.
     * - Theo IP: khong cho doi qua nhieu email khac nhau de dot han muc Brevo.
     * Thieu mot trong hai la con duong vong.
     */
    private static final Duration HOUR = Duration.ofHours(1);
    private static final Duration QUARTER_HOUR = Duration.ofMinutes(15);
    private static final int FORGOT_PER_EMAIL = 3;
    private static final int FORGOT_PER_IP = 10;
    private static final int LOGIN_PER_EMAIL = 10;
    private static final int LOGIN_PER_IP = 30;
    private static final int REGISTER_PER_IP = 5;
    private static final int RESET_PER_IP = 20;

    private final AuthService authService;
    private final GoogleAuthService googleAuthService;
    private final RateLimiterService rateLimiter;

    @Value("${app.cors.allowed-origin:http://localhost:5173}")
    private String frontendUrl;

    public AuthController(AuthService authService, GoogleAuthService googleAuthService,
                          RateLimiterService rateLimiter) {
        this.authService = authService;
        this.googleAuthService = googleAuthService;
        this.rateLimiter = rateLimiter;
    }

    private void limit(String key, int max, Duration window) {
        if (!rateLimiter.tryConsume(key, max, window)) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "rate_limited");
        }
    }

    /**
     * Dia chi IP that cua nguoi goi.
     *
     * Tren Render moi request deu di qua proxy nen getRemoteAddr() luon tra ve IP cua
     * proxy - dem theo do thi ca the gioi chung mot bo dem. Phai doc X-Forwarded-For.
     * Lay phan tu CUOI: client tu bia header nay duoc, nhung proxy noi them IP that
     * ma no nhin thay vao cuoi chuoi, nen phan cuoi la phan khong gia duoc.
     */
    private static String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            String[] parts = forwarded.split(",");
            return parts[parts.length - 1].trim();
        }
        return request.getRemoteAddr();
    }

    /** Gop email ve mot dang de "A@Gmail.com " va "a@gmail.com" khong thanh hai bo dem. */
    private static String normalize(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    @PostMapping("/register")
    public AuthResponse register(@RequestBody AuthRequest request, HttpServletRequest http) {
        limit("register:ip:" + clientIp(http), REGISTER_PER_IP, HOUR);
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody AuthRequest request, HttpServletRequest http) {
        limit("login:ip:" + clientIp(http), LOGIN_PER_IP, QUARTER_HOUR);
        limit("login:email:" + normalize(request.email()), LOGIN_PER_EMAIL, QUARTER_HOUR);
        return authService.login(request);
    }

    /**
     * Dang nhap bang Google. Body: { "credential": "<ID token tu Google>" }.
     * Tra ve dung kieu AuthResponse nhu /login, nen frontend xu ly y het nhau.
     */
    @PostMapping("/google")
    public AuthResponse loginWithGoogle(@RequestBody java.util.Map<String, String> body) {
        return googleAuthService.loginWithGoogle(body.get("credential"));
    }

    /**
     * Frontend hoi truoc xem may chu co bat dang nhap Google khong, de con quyet dinh
     * co hien nut hay khong - thay vi hien nut roi bam vao moi bao loi.
     */
    @GetMapping("/google/enabled")
    public java.util.Map<String, Object> googleEnabled() {
        boolean enabled = googleAuthService.isEnabled();
        return java.util.Map.of(
                "enabled", enabled,
                "clientId", enabled ? googleAuthService.getClientId() : "");
    }

    @PostMapping("/forgot-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void forgotPassword(@RequestBody java.util.Map<String, String> body, HttpServletRequest http) {
        limit("forgot:ip:" + clientIp(http), FORGOT_PER_IP, HOUR);
        limit("forgot:email:" + normalize(body.get("email")), FORGOT_PER_EMAIL, HOUR);
        authService.forgotPassword(body.get("email"), frontendUrl);
    }

    @PostMapping("/reset-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetPassword(@RequestBody java.util.Map<String, String> body, HttpServletRequest http) {
        limit("reset:ip:" + clientIp(http), RESET_PER_IP, HOUR);
        authService.resetPassword(body.get("token"), body.get("newPassword"));
    }
}