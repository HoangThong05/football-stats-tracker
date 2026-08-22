package com.hoangthong.footballtracker.controller;

import com.hoangthong.footballtracker.dto.FriendDto;
import com.hoangthong.footballtracker.service.FriendshipService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/friends")
public class FriendController {

    private final FriendshipService service;

    public FriendController(FriendshipService service) {
        this.service = service;
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

    @PostMapping("/{userId}")
    public void request(@AuthenticationPrincipal String email, @PathVariable long userId) {
        service.request(email, userId);
    }

    @PostMapping("/{userId}/accept")
    public void accept(@AuthenticationPrincipal String email, @PathVariable long userId) {
        service.accept(email, userId);
    }

    /** Dung chung cho: tu choi loi moi, huy loi moi da gui, huy ket ban. */
    @DeleteMapping("/{userId}")
    public void remove(@AuthenticationPrincipal String email, @PathVariable long userId) {
        service.remove(email, userId);
    }
}
