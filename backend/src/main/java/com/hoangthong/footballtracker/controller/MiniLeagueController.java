package com.hoangthong.footballtracker.controller;

import com.hoangthong.footballtracker.dto.MiniLeagueDto;
import com.hoangthong.footballtracker.service.MiniLeagueService;
import com.hoangthong.footballtracker.service.WriteRateLimiter;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.List;

@RestController
@RequestMapping("/api/leagues")
public class MiniLeagueController {

    /*
     * Vao phong siet chat nhat: moi lan goi la mot lan doan ma moi 6 ky tu, chan tay
     * lai thi khong the do het khong gian ma. Tao phong va nhan tin rong rai hon nhung
     * van du de chan script.
     */
    private static final int JOIN_PER_HOUR = 20;
    private static final int CREATE_PER_HOUR = 20;
    private static final int MESSAGE_PER_MIN = 30;

    private final MiniLeagueService service;
    private final WriteRateLimiter limiter;

    public MiniLeagueController(MiniLeagueService service, WriteRateLimiter limiter) {
        this.service = service;
        this.limiter = limiter;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MiniLeagueDto.LeagueResponse create(
            @AuthenticationPrincipal String email,
            @RequestBody MiniLeagueDto.CreateLeagueRequest req) {
        limiter.check("league-create", email, CREATE_PER_HOUR, Duration.ofHours(1));
        return service.createLeague(email, req.name());
    }

    @PostMapping("/join")
    public MiniLeagueDto.LeagueResponse join(
            @AuthenticationPrincipal String email,
            @RequestBody MiniLeagueDto.JoinLeagueRequest req) {
        limiter.check("league-join", email, JOIN_PER_HOUR, Duration.ofHours(1));
        return service.joinLeague(email, req.inviteCode());
    }

    @GetMapping("/my")
    public List<MiniLeagueDto.LeagueResponse> myLeagues(
            @AuthenticationPrincipal String email) {
        return service.myLeagues(email);
    }

    @GetMapping("/{id}/leaderboard")
    public MiniLeagueDto.LeagueLeaderboardResponse leaderboard(
            @AuthenticationPrincipal String email,
            @PathVariable Long id) {
        return service.leaderboard(email, id);
    }

    /**
     * Du doan cua ca phong cho cac tran DA LAN BANH.
     * Tran chua da khong bao gio nam trong ket qua - de khong ai chep duoc cua nhau.
     */
    @GetMapping("/{id}/picks")
    public java.util.List<MiniLeagueDto.RoomMatchPicks> roomPicks(
            @AuthenticationPrincipal String email,
            @PathVariable Long id) {
        return service.roomPicks(email, id);
    }

    /** Tin nhan trong phong. Chi thanh vien doc duoc. */
    @GetMapping("/{id}/messages")
    public java.util.List<MiniLeagueDto.RoomMessageDto> messages(
            @AuthenticationPrincipal String email,
            @PathVariable Long id) {
        return service.messages(email, id);
    }

    @PostMapping("/{id}/messages")
    public void postMessage(@AuthenticationPrincipal String email,
                            @PathVariable Long id,
                            @RequestBody java.util.Map<String, String> body) {
        limiter.check("league-message", email, MESSAGE_PER_MIN, Duration.ofMinutes(1));
        service.postMessage(email, id, body.get("content"));
    }

    @DeleteMapping("/{id}/leave")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void leave(
            @AuthenticationPrincipal String email,
            @PathVariable Long id) {
        service.leaveLeague(email, id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @AuthenticationPrincipal String email,
            @PathVariable Long id) {
        service.deleteLeague(email, id);
    }
}