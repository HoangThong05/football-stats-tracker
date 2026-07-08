package com.hoangthong.footballtracker.controller;

import com.hoangthong.footballtracker.dto.TeamDetailDto;
import com.hoangthong.footballtracker.service.TeamService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Chi tiet 1 doi bong (san nha, HLV, doi hinh...).
 * Vi du: GET http://localhost:8080/api/teams/57 (Arsenal FC)
 */
@RestController
@RequestMapping("/api/teams")
public class TeamController {

    private final TeamService service;

    public TeamController(TeamService service) {
        this.service = service;
    }

    @GetMapping("/{id}")
    public TeamDetailDto getTeam(@PathVariable long id) {
        return service.getTeam(id);
    }
}
