package com.hoangthong.footballtracker.controller;

import com.hoangthong.footballtracker.dto.MiniLeagueDto;
import com.hoangthong.footballtracker.service.MiniLeagueService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/leagues")
public class MiniLeagueController {

    private final MiniLeagueService service;

    public MiniLeagueController(MiniLeagueService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MiniLeagueDto.LeagueResponse create(
            @AuthenticationPrincipal String email,
            @RequestBody MiniLeagueDto.CreateLeagueRequest req) {
        return service.createLeague(email, req.name());
    }

    @PostMapping("/join")
    public MiniLeagueDto.LeagueResponse join(
            @AuthenticationPrincipal String email,
            @RequestBody MiniLeagueDto.JoinLeagueRequest req) {
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