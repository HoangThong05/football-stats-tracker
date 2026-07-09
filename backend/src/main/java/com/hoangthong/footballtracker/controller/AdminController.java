package com.hoangthong.footballtracker.controller;

import com.hoangthong.footballtracker.dto.UserSummaryDto;
import com.hoangthong.footballtracker.service.AdminService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

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
}
