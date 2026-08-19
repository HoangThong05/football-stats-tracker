package com.hoangthong.footballtracker.controller;

import com.hoangthong.footballtracker.dto.PlayerSearchDto;
import com.hoangthong.footballtracker.entity.IndexedPlayer;
import com.hoangthong.footballtracker.service.PlayerIndexService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/players")
public class PlayerController {

    private final PlayerIndexService service;

    public PlayerController(PlayerIndexService service) {
        this.service = service;
    }

    /**
     * Tim cau thu theo ten. Doc tu chi muc trong database, KHONG goi API ben ngoai -
     * nen khong ton han muc va tra ve gan nhu tuc thi.
     *
     * @param league de trong = tim tren tat ca cac giai da lap chi muc.
     */
    @GetMapping("/search")
    public List<PlayerSearchDto> search(@RequestParam String q,
                                        @RequestParam(required = false) String league) {
        return service.search(q, league).stream().map(PlayerController::toDto).toList();
    }

    /** Danh sach cau thu cua mot doi, lay tu chi muc. */
    @GetMapping("/by-team/{teamId}")
    public List<PlayerSearchDto> byTeam(@org.springframework.web.bind.annotation.PathVariable long teamId) {
        return service.byTeam(teamId).stream().map(PlayerController::toDto).toList();
    }

    /** Tien do lap chi muc, de giao dien noi ro dang thieu chu khong phai khong co. */
    @GetMapping("/index-status")
    public java.util.Map<String, Long> indexStatus() {
        return service.status();
    }

    private static PlayerSearchDto toDto(IndexedPlayer p) {
        return new PlayerSearchDto(
                p.getId(),
                p.getName(),
                p.getPosition(),
                p.getNationality(),
                p.getAge(),
                p.getTeamId() == null ? 0 : p.getTeamId(),
                p.getTeamName(),
                p.getTeamCrest(),
                p.getLeagueCode());
    }
}
