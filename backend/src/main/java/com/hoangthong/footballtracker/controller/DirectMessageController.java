package com.hoangthong.footballtracker.controller;

import com.hoangthong.footballtracker.dto.DirectMessageDto;
import com.hoangthong.footballtracker.service.DirectMessageService;
import com.hoangthong.footballtracker.service.WriteRateLimiter;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * Nhan tin rieng giua ban be. Tat ca deu can dang nhap (anyRequest().authenticated()).
 */
@RestController
@RequestMapping("/api/messages")
public class DirectMessageController {

    private static final int SEND_PER_MIN = 60;

    private final DirectMessageService service;
    private final WriteRateLimiter limiter;

    public DirectMessageController(DirectMessageService service, WriteRateLimiter limiter) {
        this.service = service;
        this.limiter = limiter;
    }

    /** Danh sach hoi thoai (hop thu). */
    @GetMapping
    public List<DirectMessageDto.Conversation> conversations(@AuthenticationPrincipal String email) {
        return service.conversations(email);
    }

    /** Tong so tin chua doc - cho chấm do tren nav. */
    @GetMapping("/unread")
    public Map<String, Long> unread(@AuthenticationPrincipal String email) {
        return Map.of("count", service.unreadTotal(email));
    }

    /** Toan bo tin voi mot nguoi; dong thoi danh dau da doc. */
    @GetMapping("/{userId}")
    public List<DirectMessageDto.Message> conversation(@AuthenticationPrincipal String email,
                                                       @PathVariable long userId) {
        return service.conversation(email, userId);
    }

    /** Gui tin. Body: { content, imageUrl }. */
    @PostMapping("/{userId}")
    public void send(@AuthenticationPrincipal String email, @PathVariable long userId,
                     @RequestBody Map<String, String> body) {
        limiter.check("dm-send", email, SEND_PER_MIN, Duration.ofMinutes(1));
        service.send(email, userId,
                body == null ? null : body.get("content"),
                body == null ? null : body.get("imageUrl"));
    }
}
