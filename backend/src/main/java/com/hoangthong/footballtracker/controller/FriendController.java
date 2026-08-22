package com.hoangthong.footballtracker.controller;

import com.hoangthong.footballtracker.dto.FriendDto;
import com.hoangthong.footballtracker.service.FriendshipService;
import com.hoangthong.footballtracker.service.WriteRateLimiter;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.List;

@RestController
@RequestMapping("/api/friends")
public class FriendController {

    /*
     * Gui loi moi la thu lam phien nguoi khac (hien so do o chuong cua ho) nen siet
     * chat hon cac thao tac con lai. Dong y / huy thi chi tac dong len quan he cua
     * chinh minh, rong rai hon.
     */
    private static final int REQUEST_PER_HOUR = 30;
    private static final int RESPOND_PER_HOUR = 60;

    private final FriendshipService service;
    private final WriteRateLimiter limiter;

    public FriendController(FriendshipService service, WriteRateLimiter limiter) {
        this.service = service;
        this.limiter = limiter;
    }

    @GetMapping
    public List<FriendDto> list(@AuthenticationPrincipal String email) {
        return service.friends(email);
    }

    /** Loi moi nguoi khac gui den minh, dang cho tra loi. */
    @GetMapping("/requests")
    public List<FriendDto> requests(@AuthenticationPrincipal String email) {
        return service.incomingRequests(email);
    }

    /** Loi moi cua minh vua duoc chap nhan (14 ngay gan nhat) - de bao len chuong. */
    @GetMapping("/accepted")
    public List<FriendDto> accepted(@AuthenticationPrincipal String email) {
        return service.recentlyAccepted(email);
    }

    @PostMapping("/{userId}")
    public void request(@AuthenticationPrincipal String email, @PathVariable long userId) {
        limiter.check("friend-request", email, REQUEST_PER_HOUR, Duration.ofHours(1));
        service.request(email, userId);
    }

    @PostMapping("/{userId}/accept")
    public void accept(@AuthenticationPrincipal String email, @PathVariable long userId) {
        limiter.check("friend-respond", email, RESPOND_PER_HOUR, Duration.ofHours(1));
        service.accept(email, userId);
    }

    /** Dung chung cho: tu choi loi moi, huy loi moi da gui, huy ket ban. */
    @DeleteMapping("/{userId}")
    public void remove(@AuthenticationPrincipal String email, @PathVariable long userId) {
        limiter.check("friend-respond", email, RESPOND_PER_HOUR, Duration.ofHours(1));
        service.remove(email, userId);
    }
}
