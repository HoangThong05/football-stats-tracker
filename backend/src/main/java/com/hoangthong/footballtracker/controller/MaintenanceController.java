package com.hoangthong.footballtracker.controller;

import com.hoangthong.footballtracker.dto.MaintenanceDto;
import com.hoangthong.footballtracker.service.MaintenanceService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Trang thai bao tri - CONG KHAI, de frontend hien banner ngay ca truoc khi dang nhap.
 * Chi ADMIN moi bat/tat duoc (xem AdminController#setMaintenance).
 */
@RestController
@RequestMapping("/api/maintenance")
public class MaintenanceController {

    private final MaintenanceService service;

    public MaintenanceController(MaintenanceService service) {
        this.service = service;
    }

    @GetMapping
    public MaintenanceDto status() {
        return new MaintenanceDto(service.isEnabled(), service.getMessage());
    }
}
