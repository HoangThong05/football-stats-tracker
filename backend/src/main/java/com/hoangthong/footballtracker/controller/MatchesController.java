package com.hoangthong.footballtracker.controller;

import com.hoangthong.footballtracker.dto.MatchDto;
import com.hoangthong.footballtracker.service.MatchesService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

    public MatchesController(MatchesService service) {
        this.service = service;
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
}
