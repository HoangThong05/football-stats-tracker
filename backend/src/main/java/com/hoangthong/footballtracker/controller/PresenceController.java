package com.hoangthong.footballtracker.controller;

import com.hoangthong.footballtracker.service.PresenceService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Trang thai "dang hoat dong" (cham xanh). Tat ca can dang nhap.
 */
@RestController
@RequestMapping("/api/presence")
public class PresenceController {

    private final PresenceService service;

    public PresenceController(PresenceService service) {
        this.service = service;
    }

    /** Nhip tim: bao minh dang online. Frontend goi dinh ky khi mo app. */
    @PostMapping("/ping")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void ping(@AuthenticationPrincipal String email) {
        service.ping(email);
    }

    /** Trang thai (online + moc lan cuoi) cua cac id hoi - chi cho nguoi cho phep hien. */
    @GetMapping
    public List<com.hoangthong.footballtracker.dto.PresenceDto> status(@RequestParam("ids") List<Long> ids) {
        return service.statusAmong(ids);
    }

    /** Tuy chon hien trang thai hoat dong cua chinh minh. */
    @GetMapping("/settings")
    public Map<String, Boolean> getSettings(@AuthenticationPrincipal String email) {
        return Map.of("showOnlineStatus", service.getSetting(email));
    }

    /** Bat / tat hien trang thai. Body: { "enabled": true|false }. */
    @PutMapping("/settings")
    public Map<String, Boolean> setSettings(@AuthenticationPrincipal String email,
                                            @RequestBody Map<String, Boolean> body) {
        return Map.of("showOnlineStatus", service.setSetting(email, Boolean.TRUE.equals(body.get("enabled"))));
    }
}
