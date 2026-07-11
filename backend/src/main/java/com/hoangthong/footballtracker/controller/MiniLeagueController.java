package com.hoangthong.footballtracker.controller;

import com.hoangthong.footballtracker.dto.MiniLeagueDto;
import com.hoangthong.footballtracker.service.MiniLeagueService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * API cho tinh nang Mini League (phong du doan ban be).
 * Tat ca endpoint deu yeu cau dang nhap (JWT).
 */
@RestController
@RequestMapping("/api/leagues")
public class MiniLeagueController {

    private final MiniLeagueService service;

    public MiniLeagueController(MiniLeagueService service) {
        this.service = service;
    }

    /** Tao phong moi */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MiniLeagueDto.LeagueResponse create(
            @AuthenticationPrincipal UserDetails user,
            @RequestBody MiniLeagueDto.CreateLeagueRequest req) {
        return service.createLeague(user.getUsername(), req.name());
    }

    /** Tham gia phong bang ma moi */
    @PostMapping("/join")
    public MiniLeagueDto.LeagueResponse join(
            @AuthenticationPrincipal UserDetails user,
            @RequestBody MiniLeagueDto.JoinLeagueRequest req) {
        return service.joinLeague(user.getUsername(), req.inviteCode());
    }

    /** Danh sach phong cua toi */
    @GetMapping("/my")
    public List<MiniLeagueDto.LeagueResponse> myLeagues(
            @AuthenticationPrincipal UserDetails user) {
        return service.myLeagues(user.getUsername());
    }

    /** BXH cua phong */
    @GetMapping("/{id}/leaderboard")
    public MiniLeagueDto.LeagueLeaderboardResponse leaderboard(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Long id) {
        return service.leaderboard(user.getUsername(), id);
    }

    /** Roi phong */
    @DeleteMapping("/{id}/leave")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void leave(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Long id) {
        service.leaveLeague(user.getUsername(), id);
    }

    /** Xoa phong (chi chu phong) */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Long id) {
        service.deleteLeague(user.getUsername(), id);
    }
}
