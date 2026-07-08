package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.client.FootballDataClient;
import com.hoangthong.footballtracker.client.dto.MatchesApiResponse;
import com.hoangthong.footballtracker.entity.MatchFixture;
import com.hoangthong.footballtracker.repository.MatchFixtureRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * Job dinh ky keo tran dau tu football-data.org va luu vao SQL Server.
 * Nho vay du lieu tran (dac biet lich sap dien ra) luon co san trong DB
 * de gui thong bao email, khong phu thuoc vao viec nguoi dung co mo trang hay khong.
 */
@Service
public class MatchSyncService {

    private static final Logger log = LoggerFactory.getLogger(MatchSyncService.class);

    // 6 giai dang hien thi tren frontend.
    private static final List<String> COMPETITIONS = List.of("PL", "PD", "BL1", "SA", "FL1", "CL");

    // Cua so dong bo: 2 ngay truoc (ket qua moi) -> 14 ngay toi (lich sap da).
    private static final int PAST_DAYS = 2;
    private static final int FUTURE_DAYS = 14;

    private final FootballDataClient client;
    private final MatchFixtureRepository repository;

    public MatchSyncService(FootballDataClient client, MatchFixtureRepository repository) {
        this.client = client;
        this.repository = repository;
    }

    /**
     * Chay ngay khi khoi dong (initialDelay nho) roi lap lai theo cau hinh
     * app.sync.matches-interval-ms (mac dinh 30 phut).
     */
    @Scheduled(
            initialDelayString = "${app.sync.initial-delay-ms:10000}",
            fixedDelayString = "${app.sync.matches-interval-ms:1800000}")
    public void syncAll() {
        LocalDate today = LocalDate.now();
        LocalDate from = today.minusDays(PAST_DAYS);
        LocalDate to = today.plusDays(FUTURE_DAYS);

        int totalSaved = 0;
        for (String code : COMPETITIONS) {
            try {
                totalSaved += syncCompetition(code, from, to);
            } catch (Exception ex) {
                // 1 giai loi (vd 429 rate-limit) khong duoc lam dung cac giai con lai.
                log.warn("Dong bo tran that bai cho giai {}: {}", code, ex.getMessage());
            }
        }
        log.info("Dong bo tran hoan tat: luu/cap nhat {} tran.", totalSaved);
    }

    private int syncCompetition(String code, LocalDate from, LocalDate to) {
        MatchesApiResponse response = client.getMatches(code, from, to);
        if (response == null || response.matches() == null) {
            return 0;
        }

        int count = 0;
        for (MatchesApiResponse.Match m : response.matches()) {
            repository.save(toEntity(code, m));
            count++;
        }
        return count;
    }

    private MatchFixture toEntity(String code, MatchesApiResponse.Match m) {
        // save() se update neu id da ton tai (upsert theo khoa tu nhien).
        MatchFixture fixture = repository.findById(m.id()).orElseGet(() -> new MatchFixture(m.id()));

        fixture.setCompetition(code);
        fixture.setUtcDate(Instant.parse(m.utcDate()));
        fixture.setStatus(m.status());
        fixture.setMatchday(m.matchday());

        fixture.setHomeTeamId(m.homeTeam().id());
        fixture.setHomeTeam(m.homeTeam().name());
        fixture.setHomeCrest(m.homeTeam().crest());

        fixture.setAwayTeamId(m.awayTeam().id());
        fixture.setAwayTeam(m.awayTeam().name());
        fixture.setAwayCrest(m.awayTeam().crest());

        if (m.score() != null && m.score().fullTime() != null) {
            fixture.setHomeScore(m.score().fullTime().home());
            fixture.setAwayScore(m.score().fullTime().away());
        }

        fixture.setUpdatedAt(Instant.now());
        return fixture;
    }
}
