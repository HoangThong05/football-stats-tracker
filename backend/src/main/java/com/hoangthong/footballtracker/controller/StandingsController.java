package com.hoangthong.footballtracker.controller;

import com.hoangthong.footballtracker.dto.StandingRow;
import com.hoangthong.footballtracker.service.StandingsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * API cua BAN. Frontend goi vao day, khong bao gio goi thang football-data.org.
 * Vi du: GET http://localhost:8080/api/standings/PL
 *
 * Ma giai dau thuong dung:
 *   PL  = Premier League   |  PD = La Liga     |  BL1 = Bundesliga
 *   SA  = Serie A          |  FL1 = Ligue 1    |  CL  = Champions League
 */
@RestController
@RequestMapping("/api/standings")
public class StandingsController {

    private final StandingsService service;

    public StandingsController(StandingsService service) {
        this.service = service;
    }

    @GetMapping("/{code}")
    public List<StandingRow> getStandings(@PathVariable String code) {
        return service.getStandings(code.toUpperCase());
    }
}
