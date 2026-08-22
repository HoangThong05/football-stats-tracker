package com.hoangthong.footballtracker.controller;

import com.hoangthong.footballtracker.dto.ForumDto;
import com.hoangthong.footballtracker.service.ForumService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/forum")
public class ForumController {

    private final ForumService service;

    public ForumController(ForumService service) {
        this.service = service;
    }

    /**
     * Danh sach bai viet. Khach chua dang nhap van doc duoc.
     *
     * viewerEmail null -> khong biet da thich bai nao, va khong duoc xoa gi.
     */
    @GetMapping("/posts")
    public List<ForumDto.Post> feed(@AuthenticationPrincipal String viewerEmail,
                                    @RequestParam(defaultValue = "0") int page) {
        return service.feed(viewerEmail, page);
    }

    /** Mot bai duy nhat kem het binh luan - dung khi bam vao mot dong trong chuong. */
    @GetMapping("/posts/{id}")
    public ForumDto.Post onePost(@AuthenticationPrincipal String viewerEmail, @PathVariable long id) {
        return service.onePost(viewerEmail, id);
    }

    /** Nhung viec nguoi khac vua lam voi bai/binh luan cua minh - noi dung cua chuong. */
    @GetMapping("/notifications")
    public List<ForumDto.Notification> notifications(@AuthenticationPrincipal String email) {
        return service.notifications(email);
    }

    @PostMapping("/posts")
    public void create(@AuthenticationPrincipal String email,
                       @RequestBody ForumDto.CreatePostRequest body) {
        service.createPost(email, body.content(), body.imageUrl());
    }

    /** Sua phan chu cua bai. Chi tac gia, va chi trong 1 gio dau. */
    @PutMapping("/posts/{id}")
    public void editPost(@AuthenticationPrincipal String email, @PathVariable long id,
                         @RequestBody ForumDto.EditRequest body) {
        service.editPost(email, id, body.content());
    }

    /** Xoa bai. Tac gia trong 24 gio dau, admin thi bat ky luc nao. */
    @DeleteMapping("/posts/{id}")
    public void delete(@AuthenticationPrincipal String email, @PathVariable long id) {
        service.deletePost(email, id);
    }

    /** Sua binh luan. Chi tac gia, va chi trong 1 gio dau. */
    @PutMapping("/comments/{id}")
    public void editComment(@AuthenticationPrincipal String email, @PathVariable long id,
                            @RequestBody ForumDto.EditRequest body) {
        service.editComment(email, id, body.content());
    }

    /** Xoa binh luan. Tac gia trong 24 gio dau, admin thi bat ky luc nao. */
    @DeleteMapping("/comments/{id}")
    public void deleteComment(@AuthenticationPrincipal String email, @PathVariable long id) {
        service.deleteComment(email, id);
    }

    /**
     * So bai + binh luan moi ke tu moc thoi gian frontend gui len.
     *
     * Frontend tu nho moc "lan cuoi mo dien dan" o may cua no - khong luu tren may chu:
     * mot bang nua chi de ghi "da xem den dau" la khong dang, va moc do sai lech mot
     * chut cung khong gay hai gi.
     */
    @GetMapping("/unread")
    public java.util.Map<String, Long> unread(@AuthenticationPrincipal String email,
                                              @RequestParam String since) {
        java.time.Instant moc;
        try {
            moc = java.time.Instant.parse(since);
        } catch (java.time.format.DateTimeParseException e) {
            // Moc hong (nguoi dung xoa localStorage, gia tri la) -> coi nhu chua co gi moi
            return java.util.Map.of("count", 0L);
        }
        return java.util.Map.of("count", service.unreadCount(email, moc));
    }

    @PostMapping("/posts/{id}/comments")
    public void comment(@AuthenticationPrincipal String email, @PathVariable long id,
                        @RequestBody ForumDto.CommentRequest body) {
        service.comment(email, id, body.content(), body.parentId());
    }

    /** Bam lan nua thi bo thich. */
    @PostMapping("/posts/{id}/like")
    public void like(@AuthenticationPrincipal String email, @PathVariable long id) {
        service.toggleLike(email, id);
    }

    @PostMapping("/posts/{id}/report")
    public void report(@AuthenticationPrincipal String email, @PathVariable long id,
                       @RequestBody(required = false) ForumDto.ReportRequest body) {
        service.report(email, id, body == null ? null : body.reason());
    }
}
