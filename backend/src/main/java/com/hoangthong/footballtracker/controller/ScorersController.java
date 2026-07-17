package com.hoangthong.footballtracker.controller;

import com.hoangthong.footballtracker.dto.ScorerDto;
import com.hoangthong.footballtracker.service.ScorersService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Vua pha luoi (top scorers) cua mot giai.
 * Vi du: GET http://localhost:8080/api/scorers/PL
 */
@RestController
@RequestMapping("/api/scorers")
public class ScorersController {

    private final ScorersService service;

    public ScorersController(ScorersService service) {
        this.service = service;
    }

    /** season (tuy chon): nam bat dau mua giai, vd ?season=2024 = xem lai mua 2024/25. */
    @GetMapping("/{code}")
    public ResponseEntity<List<ScorerDto>> getScorers(
            @PathVariable String code, @RequestParam(required = false) Integer season) {
        ScorersService.Result result = service.getScorers(code.toUpperCase(), season);
        return ResponseEntity.ok()
                .header("X-Season-Label", result.seasonLabel() != null ? result.seasonLabel() : "")
                .body(result.scorers());
    }
}
