package com.hoangthong.footballtracker.controller;

import com.hoangthong.footballtracker.dto.PublicProfileDto;
import com.hoangthong.footballtracker.service.PublicProfileService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final PublicProfileService service;

    public UserController(PublicProfileService service) {
        this.service = service;
    }

    /** Ho so cong khai. Mo tu do vi bang xep hang du doan von da la trang cong khai. */
    @GetMapping("/{id}/profile")
    public PublicProfileDto profile(
            @PathVariable long id,
            // Khong bat buoc dang nhap: khach van xem duoc ho so, chi khong co nut ket ban
            @org.springframework.security.core.annotation.AuthenticationPrincipal String viewerEmail) {
        return service.get(id, viewerEmail);
    }
}
