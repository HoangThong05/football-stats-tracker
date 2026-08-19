package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.dto.TeamDetailDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Lap chi muc cau thu dan dan, MOI LAN CHAY DUNG MOT DOI.
 *
 * Chi tiet doi bong ton 1 request football-data.org, ma han muc la 10 request/phut -
 * dung chung voi moi thu nguoi dung dang xem. Neu quet ca 6 giai mot luc (khoang 120 doi)
 * thi cham tran ngay, va nguoi dung dang mo trang se an 429 -> ca trang bao loi.
 *
 * Nen moi nhip chi lam mot doi. Chay het 120 doi mat vai tieng, nhung khong ai thay
 * gi ca - va sau lan dau thi du lieu nam trong database, khong phai lam lai.
 */
@Service
public class PlayerIndexWarmer {

    private static final Logger log = LoggerFactory.getLogger(PlayerIndexWarmer.class);

    /** Cung danh sach giai voi MatchSyncService. */
    private static final List<String> COMPETITIONS = List.of("PL", "PD", "BL1", "SA", "FL1", "CL");

    private final StandingsService standingsService;
    private final TeamService teamService;
    private final PlayerIndexService indexService;

    /** Hang doi cac doi con phai lam. Rong thi nhip sau se nap lai. */
    private final List<PendingTeam> queue = new ArrayList<>();

    private record PendingTeam(long teamId, String leagueCode) {}

    public PlayerIndexWarmer(StandingsService standingsService, TeamService teamService,
                             PlayerIndexService indexService) {
        this.standingsService = standingsService;
        this.teamService = teamService;
        this.indexService = indexService;
    }

    @Scheduled(
            initialDelayString = "${app.player-index.initial-delay-ms:120000}",
            fixedDelayString = "${app.player-index.interval-ms:90000}")
    public void indexNextTeam() {
        if (queue.isEmpty()) {
            refillQueue();
            if (queue.isEmpty()) {
                return; // khong con doi nao thieu
            }
        }

        PendingTeam next = queue.remove(0);
        try {
            TeamDetailDto team = teamService.getTeam(next.teamId());
            int players = indexService.indexTeam(team, next.leagueCode());
            if (players > 0) {
                indexService.logIndexed(next.leagueCode(), team.name(), players);
            }
        } catch (Exception e) {
            /*
             * Mot doi loi thi bo qua, khong dung ca job. Hay gap nhat la 403 - goi free
             * cua football-data.org khong cho xem chi tiet vai doi ngoai pham vi.
             */
            log.warn("Bo qua doi id={} khi lap chi muc: {}", next.teamId(), e.getMessage());
        }
    }

    /**
     * Nap lai hang doi bang cac doi CHUA co trong chi muc.
     *
     * Doc bang xep hang qua cache nen thuong khong ton request nao. Doi da lam roi thi
     * bo qua han - chi muc chi can lap lai khi doi hinh doi, ma chuyen do rat it xay ra
     * so voi cai gia phai tra bang han muc.
     */
    private void refillQueue() {
        for (String league : COMPETITIONS) {
            try {
                Set<Long> done = new HashSet<>(indexService.indexedTeamIds(league));
                var rows = standingsService.getStandings(league, null).rows();
                for (var row : rows) {
                    if (!done.contains(row.teamId())) {
                        queue.add(new PendingTeam(row.teamId(), league));
                    }
                }
            } catch (Exception e) {
                log.warn("Khong nap duoc danh sach doi cua giai {}: {}", league, e.getMessage());
            }
        }
        if (!queue.isEmpty()) {
            log.info("Con {} doi chua lap chi muc cau thu", queue.size());
        }
    }
}
