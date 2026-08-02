package com.hoangthong.footballtracker.controller;

import com.hoangthong.footballtracker.dto.DayMatchDto;
import com.hoangthong.footballtracker.dto.MatchDetailDto;
import com.hoangthong.footballtracker.dto.MatchDto;
import com.hoangthong.footballtracker.service.DayMatchesService;
import com.hoangthong.footballtracker.service.MatchesService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

/**
 * Lich thi dau & ket qua gan day cua mot giai.
 * Vi du: GET http://localhost:8080/api/matches/PL/upcoming
 *        GET http://localhost:8080/api/matches/PL/results
 */
@RestController
@RequestMapping("/api/matches")
public class MatchesController {

    private final MatchesService service;
    private final DayMatchesService dayMatchesService;

    public MatchesController(MatchesService service, DayMatchesService dayMatchesService) {
        this.service = service;
        this.dayMatchesService = dayMatchesService;
    }

    /** Cac tran trong 14 ngay toi, tran gan nhat truoc. */
    @GetMapping("/{code}/upcoming")
    public List<MatchDto> getUpcoming(@PathVariable String code) {
        return service.getUpcoming(code.toUpperCase());
    }

    /** Ket qua 14 ngay qua, tran moi nhat truoc. */
    @GetMapping("/{code}/results")
    public List<MatchDto> getResults(@PathVariable String code) {
        return service.getResults(code.toUpperCase());
    }

    /** Chi tiet 1 tran theo id (football-data.org matchId), vi du /api/matches/12345. */
    @GetMapping("/{id:\\d+}")
    public MatchDetailDto getMatch(@PathVariable long id) {
        return service.getMatchDetail(id);
    }

    /** 5 tran gan nhat giua 2 doi, vi du /api/matches/head-to-head?teamA=57&teamB=61. */
    @GetMapping("/head-to-head")
    public List<MatchDto> getHeadToHead(@RequestParam long teamA, @RequestParam long teamB) {
        return service.getHeadToHead(teamA, teamB);
    }

    /**
     * Tran cua MOI giai trong 1 khoang thoi gian - dung cho trang "Hom nay".
     * from/to la moc thoi diem ISO-8601 (vd 2026-08-03T17:00:00Z): frontend tu tinh
     * dau/cuoi ngay theo MUI GIO NGUOI DUNG roi gui len, nen tran da luc 3h sang gio VN
     * van nam dung ngay ma nguoi dung nhin thay.
     * Vi du: /api/matches/range?from=2026-08-02T17:00:00Z&to=2026-08-03T17:00:00Z
     */
    @GetMapping("/range")
    public List<DayMatchDto> getMatchesInRange(@RequestParam Instant from, @RequestParam Instant to) {
        return dayMatchesService.getMatchesBetween(from, to);
    }
}
