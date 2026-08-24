package com.hoangthong.footballtracker.controller;

import com.hoangthong.footballtracker.entity.User;
import com.hoangthong.footballtracker.repository.UserRepository;
import com.hoangthong.footballtracker.service.WebPushService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

/**
 * Bat/tat thong bao day cho tung thiet bi.
 *
 * Frontend lay khoa cong khai (public-key), dung no de dang ky voi trinh duyet, roi gui
 * dang ky (subscribe) len day de luu. Khi tat thi goi unsubscribe.
 */
@RestController
@RequestMapping("/api/push")
public class PushController {

    private final WebPushService webPush;
    private final UserRepository userRepo;

    public PushController(WebPushService webPush, UserRepository userRepo) {
        this.webPush = webPush;
        this.userRepo = userRepo;
    }

    /**
     * Khoa cong khai VAPID cho frontend. Tra { enabled, publicKey }.
     * enabled=false thi frontend an nut "Bat thong bao".
     */
    @GetMapping("/public-key")
    public Map<String, Object> publicKey() {
        return Map.of(
                "enabled", webPush.isEnabled(),
                "publicKey", webPush.isEnabled() ? webPush.getPublicKey() : "");
    }

    /** Luu mot dang ky. Body: { endpoint, keys: { p256dh, auth } }. */
    @PostMapping("/subscribe")
    @SuppressWarnings("unchecked")
    public void subscribe(@AuthenticationPrincipal String email, @RequestBody Map<String, Object> body) {
        User user = requireUser(email);
        Object endpoint = body.get("endpoint");
        Object keysObj = body.get("keys");
        if (!(endpoint instanceof String ep) || !(keysObj instanceof Map)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid_subscription");
        }
        Map<String, Object> keys = (Map<String, Object>) keysObj;
        Object p256dh = keys.get("p256dh");
        Object auth = keys.get("auth");
        if (!(p256dh instanceof String) || !(auth instanceof String)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid_subscription");
        }
        webPush.subscribe(user, ep, (String) p256dh, (String) auth);
    }

    /** Xoa mot dang ky. Body: { endpoint }. */
    @PostMapping("/unsubscribe")
    public void unsubscribe(@AuthenticationPrincipal String email, @RequestBody Map<String, String> body) {
        requireUser(email);
        webPush.unsubscribe(body == null ? null : body.get("endpoint"));
    }

    private User requireUser(String email) {
        if (email == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid_credentials");
        }
        return userRepo.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid_credentials"));
    }
}
