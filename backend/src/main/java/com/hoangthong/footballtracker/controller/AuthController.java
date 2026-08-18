package com.hoangthong.footballtracker.controller;

import com.hoangthong.footballtracker.dto.AuthRequest;
import com.hoangthong.footballtracker.dto.AuthResponse;
import com.hoangthong.footballtracker.service.AuthService;
import com.hoangthong.footballtracker.service.GoogleAuthService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/**
 * Dang ky / dang nhap, tra ve JWT. Gan token nay vao header
 * "Authorization: Bearer <token>" cho cac API can dang nhap (VD /api/favorites).
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final GoogleAuthService googleAuthService;

    @Value("${app.cors.allowed-origin:http://localhost:5173}")
    private String frontendUrl;

    public AuthController(AuthService authService, GoogleAuthService googleAuthService) {
        this.authService = authService;
        this.googleAuthService = googleAuthService;
    }

    @PostMapping("/register")
    public AuthResponse register(@RequestBody AuthRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody AuthRequest request) {
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
    public void forgotPassword(@RequestBody java.util.Map<String, String> body) {
        authService.forgotPassword(body.get("email"), frontendUrl);
    }

    @PostMapping("/reset-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetPassword(@RequestBody java.util.Map<String, String> body) {
        authService.resetPassword(body.get("token"), body.get("newPassword"));
    }
}