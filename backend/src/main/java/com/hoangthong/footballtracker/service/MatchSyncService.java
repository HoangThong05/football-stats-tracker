package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.client.FootballDataClient;
import com.hoangthong.footballtracker.client.dto.MatchesApiResponse;
import com.hoangthong.footballtracker.entity.MatchFixture;
import com.hoangthong.footballtracker.repository.MatchFixtureRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
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

    /*
     * Cua so coi la "dang co bong lan".
     *
     * Lui 3 gio: mot tran keo dai chung 2 tieng, cong bu gio va hiep phu.
     * Tien 10 phut: bat dau day nhip TRUOC gio bong lan, de phut dau tien da co so lieu
     * dung thay vi doi den nhip sau moi biet tran da bat dau.
     */
    private static final Duration LIVE_LOOKBACK = Duration.ofHours(3);
    private static final Duration LIVE_LOOKAHEAD = Duration.ofMinutes(10);
    private static final int MAX_LIVE_PER_TICK = 3;
    private static final List<String> LIVE_STATUSES =
            List.of("SCHEDULED", "TIMED", "IN_PLAY", "PAUSED");

    // So ngay nhin lui khi "sua tran cu bi ket trang thai" - xem repairUnfinishedPastMatches.
    private static final int REPAIR_PAST_DAYS = 30;

    private final FootballDataClient client;
    private final MatchFixtureRepository repository;
    private final PredictionScoringService scoringService;

    /*
     * Gio bong lan (kickoff) cua cac tran trong cua so dong bo, nap tu syncAll moi 60 phut.
     * syncLiveCompetitions xem danh sach nay TRONG RAM de biet "co dang gio bong lan khong"
     * ma KHONG phai truy van DB - nho vay ngoai gio co tran, Neon duoc ngu (do compute-hours).
     * volatile: syncAll ghi, syncLiveCompetitions doc o hai luong lap lich khac nhau.
     */
    private volatile List<Instant> kickoffs = List.of();
    // syncAll da nap lich lan nao chua. Khi CHUA nap (vua khoi dong), khong duoc dung cache
    // rong de bo qua dong bo live - co the dang co tran live ma minh chua biet. Chi khi DA nap
    // ma van rong (vd trai mua) moi thuc su "khong co gi de dong bo".
    private volatile boolean kickoffsLoaded = false;

    public MatchSyncService(FootballDataClient client, MatchFixtureRepository repository,
                            PredictionScoringService scoringService) {
        this.client = client;
        this.repository = repository;
        this.scoringService = scoringService;
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

        List<Instant> collected = new ArrayList<>();
        int totalSaved = 0;
        for (String code : COMPETITIONS) {
            try {
                totalSaved += syncCompetition(code, from, to, collected);
            } catch (Exception ex) {
                // 1 giai loi (vd 429 rate-limit) khong duoc lam dung cac giai con lai.
                log.warn("Dong bo tran that bai cho giai {}: {}", code, ex.getMessage());
            }
        }
        // Trao doi tham chieu (atomic nho volatile) cho job live doc gio bong lan moi nhat.
        this.kickoffs = List.copyOf(collected);
        this.kickoffsLoaded = true;
        log.info("Dong bo tran hoan tat: luu/cap nhat {} tran.", totalSaved);
    }

    /**
     * Dong bo DAY HON, nhung chi cho nhung giai dang co tran lan banh.
     *
     * Vi sao can: nhip 30 phut o tren du cho lich thi dau, nhung voi ti so dang chay thi
     * qua thua - doi ghi ban ma bang ti so tren dau trang van hien 0-0 suot hai muoi may
     * phut. Giao dien da tu goi lai moi 60 giay, chinh du lieu phia sau moi la cho cu.
     *
     * Vi sao khong don gian ha nhip 30 phut xuong 2 phut: 6 giai x 30 lan/gio = 180
     * request moi gio, trong khi han muc la 10 request/PHUT dung chung voi moi thu
     * nguoi dung dang xem. Loc theo giai dang co bong lan thi thuong chi con 1-2 giai,
     * tuc 1-2 request moi 2 phut - gan nhu khong dang ke.
     */
    @Scheduled(
            initialDelayString = "${app.sync.live-initial-delay-ms:60000}",
            fixedDelayString = "${app.sync.live-interval-ms:120000}")
    public void syncLiveCompetitions() {
        Instant now = Instant.now();

        /*
         * Cong tac trong RAM: neu BAY GIO khong roi vao khung gio tran nao (xem kickoffs
         * da nap tu syncAll) thi ve ngay - KHONG cham DB. Day la mau chot giup Neon ngu
         * suot dem va nhung luc khong co bong lan, thay vi bi danh thuc moi 10 phut.
         */
        if (!isLiveWindowNow(now)) {
            return;
        }

        List<String> live = repository.findCompetitionsWithMatchesAround(
                LIVE_STATUSES, now.minus(LIVE_LOOKBACK), now.plus(LIVE_LOOKAHEAD));

        if (live.isEmpty()) {
            return; // khong co tran nao - khong ton request nao ca
        }

        /*
         * Chan tren so giai moi nhip. Ngay cuoi tuan cao diem co the ca 6 giai cung da,
         * luc do lay het se an 6/10 request moi 2 phut; nguoi dung dang mo trang se
         * phai tranh cho. Giai bi bo lai o nhip nay se duoc lay o nhip sau.
         */
        List<String> batch = live.size() > MAX_LIVE_PER_TICK ? live.subList(0, MAX_LIVE_PER_TICK) : live;

        LocalDate today = LocalDate.now();
        int saved = 0;
        for (String code : batch) {
            try {
                // Cua so hep: chi hom qua -> ngay mai, du cho tran dang da.
                // kickoffs do syncAll phu trach nap, o day khong can gom -> truyen null.
                saved += syncCompetition(code, today.minusDays(1), today.plusDays(1), null);
            } catch (Exception ex) {
                log.warn("Dong bo truc tiep that bai cho giai {}: {}", code, ex.getMessage());
            }
        }
        log.info("Dong bo truc tiep {} giai {}: cap nhat {} tran.", batch.size(), batch, saved);
    }

    /**
     * Sua cac tran "da qua gio nhung status van la chua xong" (SCHEDULED/TIMED/IN_PLAY/PAUSED).
     *
     * Tinh huong xay ra khi dong bo bi gian doan ngay luc tran dien ra (vd DB het quota) va
     * tran da troi ra khoi cua so cua syncAll (PAST_DAYS = 2 ngay) truoc khi kip cap nhat ->
     * ket trang thai cu mai mai, keo theo du doan khong bao gio duoc cham diem.
     *
     * Quet {@link #REPAIR_PAST_DAYS} ngay gan nhat; CHI goi API khi that su con tran ket, con
     * moi thu dung thi khong ton request nao -> nhe DB, hop voi han che quota.
     */
    @Scheduled(
            initialDelayString = "${app.sync.repair-initial-delay-ms:90000}",
            fixedDelayString = "${app.sync.repair-interval-ms:21600000}")
    public void repairUnfinishedPastMatches() {
        Instant now = Instant.now();
        Instant from = now.minus(Duration.ofDays(REPAIR_PAST_DAYS));

        // Giai co tran DA QUA GIO (utcDate <= now) nhung status van chua xong.
        List<String> stale = repository.findCompetitionsWithMatchesAround(LIVE_STATUSES, from, now);
        if (stale.isEmpty()) {
            return; // moi tran cu da FINISHED dung -> khong goi API, khong ton gi
        }

        LocalDate today = LocalDate.now();
        int saved = 0;
        for (String code : stale) {
            try {
                saved += syncCompetition(code, today.minusDays(REPAIR_PAST_DAYS), today.plusDays(1), null);
            } catch (Exception ex) {
                log.warn("Sua tran cu that bai cho giai {}: {}", code, ex.getMessage());
            }
        }
        log.info("Sua trang thai tran cu: {} giai {}, cap nhat {} tran.", stale.size(), stale, saved);

        // Vua co tran chuyen sang FINISHED -> cham diem NGAY trong luot nay, khong bat nguoi
        // dung doi den luot cham dinh ky ke tiep (toi 60 phut sau) moi thay diem/chuoi cap nhat.
        if (saved > 0) {
            try {
                scoringService.scoreFinishedMatches();
            } catch (Exception ex) {
                log.warn("Cham diem bu sau khi sua tran cu that bai: {}", ex.getMessage());
            }
        }
    }

    /**
     * Keo tran cua mot giai ve DB. Neu kickoffSink khac null thi gom them gio bong lan
     * cua tung tran vao do (syncAll dung de nap cache cong tac live).
     */
    private int syncCompetition(String code, LocalDate from, LocalDate to, List<Instant> kickoffSink) {
        MatchesApiResponse response = client.getMatches(code, from, to);
        if (response == null || response.matches() == null) {
            return 0;
        }

        int count = 0;
        for (MatchesApiResponse.Match m : response.matches()) {
            repository.save(toEntity(code, m));
            if (kickoffSink != null) {
                try {
                    kickoffSink.add(Instant.parse(m.utcDate()));
                } catch (Exception ignore) {
                    // utcDate hong -> bo qua tran do khoi cache, khong lam vo ca me dong bo
                }
            }
            count++;
        }
        return count;
    }

    /**
     * BAY GIO co roi vao khung "dang co bong lan" cua tran nao khong - xet trong RAM.
     * Cua so moi tran: [kickoff - LOOKAHEAD, kickoff + LOOKBACK], trung voi dieu kien
     * loc o syncLiveCompetitions.
     */
    private boolean isLiveWindowNow(Instant now) {
        // Chua tung nap lich (vua khoi dong) -> dong bo cho an toan, dung bo lo tran dang da.
        if (!kickoffsLoaded) {
            return true;
        }
        for (Instant kickoff : kickoffs) {
            if (now.isAfter(kickoff.minus(LIVE_LOOKAHEAD)) && now.isBefore(kickoff.plus(LIVE_LOOKBACK))) {
                return true;
            }
        }
        return false;
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
