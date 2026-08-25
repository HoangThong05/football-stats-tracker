package com.hoangthong.footballtracker.controller;

import com.hoangthong.footballtracker.dto.AnnouncementDto;
import com.hoangthong.footballtracker.repository.AnnouncementRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Thong bao toan he thong cho MOI nguoi dung dang nhap doc (hien tren chuong).
 * Chi ADMIN moi tao duoc (xem AdminController#broadcast).
 */
@RestController
@RequestMapping("/api/announcements")
public class AnnouncementController {

    private static final int LIMIT = 20;
    private static final Duration WINDOW = Duration.ofDays(30);

    private final AnnouncementRepository repo;

    public AnnouncementController(AnnouncementRepository repo) {
        this.repo = repo;
    }

    /** Cac thong bao trong 30 ngay gan day, moi nhat truoc. */
    @GetMapping
    public List<AnnouncementDto> recent() {
        return repo.findByCreatedAtAfterOrderByCreatedAtDesc(Instant.now().minus(WINDOW), PageRequest.of(0, LIMIT))
                .stream()
                .map(a -> new AnnouncementDto(a.getId(), a.getTitle(), a.getBody(), a.getCreatedAt().toString()))
                .toList();
    }
}
