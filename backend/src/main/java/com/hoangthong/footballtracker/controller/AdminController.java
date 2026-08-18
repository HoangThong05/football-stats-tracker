package com.hoangthong.footballtracker.controller;

import com.hoangthong.footballtracker.dto.AdminStatsDto;
import com.hoangthong.footballtracker.dto.UserSummaryDto;
import com.hoangthong.footballtracker.service.AdminService;
import org.springframework.http.HttpStatus;
import java.security.Principal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * API danh cho ADMIN. SecurityConfig da chan /api/admin/** chi cho role ADMIN,
 * nen user thuong goi vao day se bi 403 Forbidden.
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    /** Danh sach tat ca nguoi dung (chi ADMIN xem duoc). */
    @GetMapping("/users")
    public List<UserSummaryDto> listUsers() {
        return adminService.listUsers();
    }

    /** So lieu tong quan + han muc API con lai. */
    @GetMapping("/stats")
    public AdminStatsDto stats() {
        return adminService.stats();
    }

    /** Xoa cache doc tu football-data.org, khong cho het 30 phut TTL. */
    @PostMapping("/cache/clear")
    public Map<String, Integer> clearCaches() {
        return Map.of("cleared", adminService.clearCaches());
    }

    /** Chay dong bo lich thi dau ngay lap tuc. */
    @PostMapping("/sync-matches")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void syncMatches() {
        adminService.syncMatchesNow();
    }

    /**
     * Doi vai tro nguoi dung. Body: { "role": "ADMIN" } hoac { "role": "USER" }.
     *
     * Lay email nguoi dang goi tu TOKEN (khong phai tu body) de chan viec tu ha quyen
     * chinh minh - de client tu khai thi ai cung gia mao duoc.
     *
     * Dung Principal chu khong dung @AuthenticationPrincipal UserDetails: JwtAuthFilter
     * dat thang chuoi email lam principal chu khong dung doi tuong UserDetails, nen ep
     * kieu do se ra null roi NPE. getName() tra ve dung chuoi email do.
     */
    @PatchMapping("/users/{id}/role")
    public UserSummaryDto changeRole(
            @PathVariable long id,
            @RequestBody Map<String, String> body,
            Principal actingUser) {
        return adminService.changeRole(id, body.get("role"), actingUser.getName());
    }
}
