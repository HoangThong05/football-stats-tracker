package com.hoangthong.footballtracker.controller;

import com.hoangthong.footballtracker.entity.User;
import com.hoangthong.footballtracker.repository.UserRepository;
import com.hoangthong.footballtracker.service.WebPushService;
import com.hoangthong.footballtracker.service.WriteRateLimiter;
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

    // Nguong rong rai - nguoi that bat/tat vai lan la cung; chi chan script goi lien tuc
    private static final int PUSH_PER_MIN = 30;
    private static final java.time.Duration ONE_MIN = java.time.Duration.ofMinutes(1);

    private final WebPushService webPush;
    private final UserRepository userRepo;
    private final WriteRateLimiter limiter;

    public PushController(WebPushService webPush, UserRepository userRepo, WriteRateLimiter limiter) {
        this.webPush = webPush;
        this.userRepo = userRepo;
        this.limiter = limiter;
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
        limiter.check("push-sub", email, PUSH_PER_MIN, ONE_MIN);
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
        limiter.check("push-sub", email, PUSH_PER_MIN, ONE_MIN);
        User user = requireUser(email);
        webPush.unsubscribe(user, body == null ? null : body.get("endpoint"));
    }

    private User requireUser(String email) {
        if (email == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid_credentials");
        }
        return userRepo.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid_credentials"));
    }
}
