package com.hoangthong.footballtracker.controller;

import com.hoangthong.footballtracker.dto.TeamDetailDto;
import com.hoangthong.footballtracker.service.TeamService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.HttpClientErrorException;

import java.util.Map;

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
    public ResponseEntity<?> getTeam(@PathVariable long id) {
        try {
            TeamDetailDto team = service.getTeam(id);
            return ResponseEntity.ok(team);
        } catch (HttpClientErrorException.Forbidden e) {
            // football-data.org goi free khong cho xem chi tiet mot so doi
            // (thuong la doi thuoc giai/vong loai ngoai pham vi 12 giai duoc ho tro).
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Doi bong nay khong nam trong pham vi du lieu mien phi cua football-data.org"));
        }
    }
}