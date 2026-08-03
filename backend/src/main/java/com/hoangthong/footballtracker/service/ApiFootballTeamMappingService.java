package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.client.ApiFootballClient;
import com.hoangthong.footballtracker.client.dto.ApiFootballTeamListResponse.TeamWrapper;
import com.hoangthong.footballtracker.entity.ApiFootballSyncState;
import com.hoangthong.footballtracker.entity.ApiFootballTeamMap;
import com.hoangthong.footballtracker.repository.ApiFootballSyncStateRepository;
import com.hoangthong.footballtracker.repository.ApiFootballTeamMapRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Anh xa ten doi cua football-data.org -> id doi cua API-Football.
 *
 * Lay ca danh sach doi theo TUNG GIAI qua /teams?league=..&season=.. (ten chuan 100%
 * tu chinh API-Football) roi tu doi chieu trong code, thay vi search tung ten rieng le
 * (de truot vi ten viet tat/dau cau khac nhau).
 *
 * BA LOP LUU, uu tien tu re den dat:
 *   1. RAM   - nhanh nhat, nhung mat khi app khoi dong lai
 *   2. DB    - con nguyen sau khi app ngu day (Render goi free ngu sau ~15 phut)
 *   3. API   - chi goi khi DB trong hoac da qua cu
 *
 * Truoc day chi co lop 1: moi lan app thuc day la 6 request de dung lai bang map.
 * Ngay ngu/thuc vai chuc lan la dot het quota va de bi danh dau lam dung.
 */
@Service
public class ApiFootballTeamMappingService {

    private static final Logger log = LoggerFactory.getLogger(ApiFootballTeamMappingService.class);

    /**
     * Goi free chi cho xem mot so mua nhat dinh (khong co mua hien tai). Ten + id doi
     * gan nhu khong doi qua cac mua nen dung mua cu van dung.
     */
    private static final List<Integer> SEASONS = List.of(2024);

    /** Ten doi hiem khi doi -> 30 ngay moi lay lai 1 lan la du. */
    private static final long REFRESH_INTERVAL_DAYS = 30;

    /**
     * Sau khi goi API THAT BAI thi cho bao lau moi thu lai.
     * Khong co con so nay, luc tai khoan bi khoa (API luon tra rong) se thanh: moi lan
     * co nguoi mo trang chi tiet doi = 6 request nua -> tu dot quota cua chinh minh.
     */
    private static final long RETRY_AFTER_FAILURE_HOURS = 6;

    // id giai cua API-Football (khac voi football-data.org)
    private static final List<Integer> LEAGUE_IDS = List.of(
            39,  // Premier League
            140, // La Liga
            78,  // Bundesliga
            135, // Serie A
            61,  // Ligue 1
            2    // Champions League
    );

    private final ApiFootballClient client;
    private final ApiFootballTeamMapRepository repository;
    private final ApiFootballSyncStateRepository syncStateRepository;

    /** Cache lop 1 (RAM). Rong = chua nap tu DB lan nao trong vong doi app nay. */
    private volatile Map<String, Long> nameToId = Map.of();

    public ApiFootballTeamMappingService(
            ApiFootballClient client,
            ApiFootballTeamMapRepository repository,
            ApiFootballSyncStateRepository syncStateRepository) {
        this.client = client;
        this.repository = repository;
        this.syncStateRepository = syncStateRepository;
    }

    public synchronized Optional<Long> findTeamId(String teamName) {
        ensureLoaded();

        String key = normalize(teamName);
        if (key.isEmpty()) return Optional.empty();

        Long exact = nameToId.get(key);
        if (exact != null) return Optional.of(exact);

        // Khop mem: "Newcastle United" vs "Newcastle"
        return nameToId.entrySet().stream()
                .filter(e -> e.getKey().contains(key) || key.contains(e.getKey()))
                .map(Map.Entry::getValue)
                .findFirst();
    }

    private void ensureLoaded() {
        if (nameToId.isEmpty()) {
            loadFromDatabase();
        }

        boolean needsRefresh = nameToId.isEmpty() || isDatabaseStale();
        // Vua thu cach day chua lau (va truot) thi DUNG goi lai - day la thu duy nhat
        // chan duoc canh "moi luot xem trang = 6 request" khi API dang tu choi.
        if (needsRefresh && !isCoolingDown()) {
            refreshFromApi();
        }
    }

    /** Con trong thoi gian cho sau mot lan goi API that bai? */
    private boolean isCoolingDown() {
        return syncStateRepository.findById(ApiFootballSyncState.SINGLETON_ID)
                .map(state -> Duration.between(state.getLastAttemptAt(), Instant.now())
                        .toHours() < RETRY_AFTER_FAILURE_HOURS)
                .orElse(false);
    }

    /** Ghi lai moc thoi gian da THU goi API (du thanh cong hay khong). */
    private void recordAttempt(boolean success) {
        ApiFootballSyncState state = syncStateRepository.findById(ApiFootballSyncState.SINGLETON_ID)
                .orElseGet(() -> new ApiFootballSyncState(Instant.EPOCH));
        state.markAttempt(success);
        syncStateRepository.save(state);
    }

    private void loadFromDatabase() {
        List<ApiFootballTeamMap> rows = repository.findAll();
        if (rows.isEmpty()) return;

        Map<String, Long> map = new HashMap<>();
        for (ApiFootballTeamMap row : rows) {
            map.put(row.getNormalizedName(), row.getApiFootballId());
        }
        nameToId = map;
        log.info("Nap bang map API-Football tu DB: {} doi (khong ton request nao)", map.size());
    }

    private boolean isDatabaseStale() {
        return repository.findLastUpdatedAt()
                .map(last -> Duration.between(last, Instant.now()).toDays() >= REFRESH_INTERVAL_DAYS)
                .orElse(true);
    }

    /** Goi API-Football lay ten + id doi cua 6 giai, roi luu ca vao DB lan RAM. */
    private void refreshFromApi() {
        Map<String, Long> map = new HashMap<>();
        for (Integer leagueId : LEAGUE_IDS) {
            for (Integer season : SEASONS) {
                List<TeamWrapper> teams = client.getTeamsInLeague(leagueId, season);
                for (TeamWrapper t : teams) {
                    if (t.team() != null && t.team().name() != null) {
                        String key = normalize(t.team().name());
                        if (!key.isEmpty()) map.putIfAbsent(key, t.team().id());
                    }
                }
                log.info("Da lay {} doi tu giai id={} season={} tren API-Football", teams.size(), leagueId, season);
            }
        }

        if (map.isEmpty()) {
            // Tai khoan bi khoa / het quota / mat mang -> GIU nguyen du lieu cu,
            // tha dung ban map cu con hon xoa trang roi khong map duoc doi nao.
            recordAttempt(false);
            log.warn("Khong lay duoc doi nao tu API-Football, giu nguyen bang map hien co ({} doi). "
                    + "Se khong thu lai trong {} gio toi.", nameToId.size(), RETRY_AFTER_FAILURE_HOURS);
            return;
        }

        List<ApiFootballTeamMap> rows = new ArrayList<>();
        for (Map.Entry<String, Long> e : map.entrySet()) {
            ApiFootballTeamMap row = repository.findById(e.getKey())
                    .orElseGet(() -> new ApiFootballTeamMap(e.getKey(), e.getValue()));
            row.setApiFootballId(e.getValue());
            rows.add(row);
        }
        repository.saveAll(rows);
        recordAttempt(true);

        nameToId = map;
        log.info("Cache mapping API-Football hoan tat: {} doi, da luu xuong DB", map.size());
    }

    private String normalize(String name) {
        return name.toLowerCase()
                .replaceAll("(?i)\\bfc\\b", "")
                .replaceAll("(?i)\\bcf\\b", "")
                .replaceAll("[^a-z0-9]", "")
                .trim();
    }
}
