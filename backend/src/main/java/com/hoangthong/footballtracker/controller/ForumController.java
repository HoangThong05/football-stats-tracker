package com.hoangthong.footballtracker.controller;

import com.hoangthong.footballtracker.dto.ForumDto;
import com.hoangthong.footballtracker.service.ForumService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
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

    @PostMapping("/posts")
    public void create(@AuthenticationPrincipal String email,
                       @RequestBody ForumDto.CreatePostRequest body) {
        service.createPost(email, body.content(), body.imageUrl());
    }

    @DeleteMapping("/posts/{id}")
    public void delete(@AuthenticationPrincipal String email, @PathVariable long id) {
        service.deletePost(email, id);
    }

    @PostMapping("/posts/{id}/comments")
    public void comment(@AuthenticationPrincipal String email, @PathVariable long id,
                        @RequestBody ForumDto.CommentRequest body) {
        service.comment(email, id, body.content());
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
