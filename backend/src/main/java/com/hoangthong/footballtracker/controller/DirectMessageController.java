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

    /** Gui tin. Body: { content, imageUrl, replyToId }. */
    @PostMapping("/{userId}")
    public void send(@AuthenticationPrincipal String email, @PathVariable long userId,
                     @RequestBody Map<String, Object> body) {
        limiter.check("dm-send", email, SEND_PER_MIN, Duration.ofMinutes(1));
        String content = body.get("content") == null ? null : String.valueOf(body.get("content"));
        String image = body.get("imageUrl") == null ? null : String.valueOf(body.get("imageUrl"));
        Long replyToId = body.get("replyToId") instanceof Number n ? n.longValue() : null;
        service.send(email, userId, content, image, replyToId);
    }

    /** Tha / doi / go cam xuc mot tin. Body: { type }. */
    @PostMapping("/react/{messageId}")
    public void react(@AuthenticationPrincipal String email, @PathVariable long messageId,
                      @RequestBody(required = false) Map<String, String> body) {
        limiter.check("dm-react", email, SEND_PER_MIN, Duration.ofMinutes(1));
        service.react(email, messageId,
                com.hoangthong.footballtracker.entity.ReactionType.fromString(body == null ? null : body.get("type")));
    }
}
