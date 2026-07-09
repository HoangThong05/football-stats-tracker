package com.hoangthong.footballtracker.controller;

import com.hoangthong.footballtracker.dto.ScorerDto;
import com.hoangthong.footballtracker.service.ScorersService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
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

    @GetMapping("/{code}")
    public List<ScorerDto> getScorers(@PathVariable String code) {
        return service.getScorers(code.toUpperCase());
    }
}
