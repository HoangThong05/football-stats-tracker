package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.client.ApiQuotaTracker;
import com.hoangthong.footballtracker.config.CacheConfig;
import com.hoangthong.footballtracker.dto.AdminStatsDto;
import com.hoangthong.footballtracker.dto.UserSummaryDto;
import com.hoangthong.footballtracker.entity.Role;
import com.hoangthong.footballtracker.entity.User;
import com.hoangthong.footballtracker.repository.MatchFixtureRepository;
import com.hoangthong.footballtracker.repository.MiniLeagueRepository;
import com.hoangthong.footballtracker.repository.PredictionRepository;
import com.hoangthong.footballtracker.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class AdminService {

    private static final Logger log = LoggerFactory.getLogger(AdminService.class);

    private static final List<String> CACHE_NAMES = List.of(
            CacheConfig.STANDINGS_CACHE,
            CacheConfig.MATCHES_CACHE,
            CacheConfig.TEAMS_CACHE,
            CacheConfig.SCORERS_CACHE);

    private final UserRepository userRepository;
    private final PredictionRepository predictionRepository;
    private final MiniLeagueRepository miniLeagueRepository;
    private final MatchFixtureRepository matchFixtureRepository;
    private final CacheManager cacheManager;
    private final ApiQuotaTracker quotaTracker;
    private final MatchSyncService matchSyncService;

    public AdminService(
            UserRepository userRepository,
            PredictionRepository predictionRepository,
            MiniLeagueRepository miniLeagueRepository,
            MatchFixtureRepository matchFixtureRepository,
            CacheManager cacheManager,
            ApiQuotaTracker quotaTracker,
            MatchSyncService matchSyncService) {
        this.userRepository = userRepository;
        this.predictionRepository = predictionRepository;
        this.miniLeagueRepository = miniLeagueRepository;
        this.matchFixtureRepository = matchFixtureRepository;
        this.cacheManager = cacheManager;
        this.quotaTracker = quotaTracker;
        this.matchSyncService = matchSyncService;
    }

    public List<UserSummaryDto> listUsers() {
        return userRepository.findAll().stream()
                .map(u -> new UserSummaryDto(
                        u.getId(),
                        u.getEmail(),
                        u.getRole().name(),
                        u.getCreatedAt().toString()))
                .toList();
    }

    /** So lieu tong quan + tinh trang han muc API, cho trang quan tri. */
    public AdminStatsDto stats() {
        ApiQuotaTracker.Snapshot quota = quotaTracker.latest();

        return new AdminStatsDto(
                userRepository.count(),
                userRepository.countByRole(Role.ADMIN),
                predictionRepository.count(),
                miniLeagueRepository.count(),
                matchFixtureRepository.count(),
                quota.remaining(),
                quota.seenAt() != null ? quota.seenAt().toString() : null);
    }

    /**
     * Xoa toan bo cache doc tu football-data.org.
     *
     * Dung khi ti so hien sai ma khong muon ngoi cho het 30 phut TTL. Chi xoa cache doc,
     * khong dong toi du lieu nguoi dung - lan goi tiep theo se lay lai tu nguon.
     *
     * @return so cache da xoa
     */
    public int clearCaches() {
        int cleared = 0;
        for (String name : CACHE_NAMES) {
            Cache cache = cacheManager.getCache(name);
            if (cache != null) {
                cache.clear();
                cleared++;
            }
        }
        log.info("ADMIN xoa cache: da xoa {} cache", cleared);
        return cleared;
    }

    /** Chay dong bo lich thi dau ngay, khong doi chu ky 30 phut. */
    public void syncMatchesNow() {
        log.info("ADMIN yeu cau dong bo tran ngay lap tuc");
        matchSyncService.syncAll();
    }

    /**
     * Doi vai tro cua mot nguoi dung.
     *
     * HAI CHOT CHAN, thieu cai nao cung co the tu khoa minh ra ngoai:
     *
     * 1. Khong cho tu ha quyen CHINH MINH. Bam nham mot cai la mat trang quan tri ngay
     *    trong phien dang dung, phai mo SQL Editor len sua tay moi vao lai duoc.
     *
     * 2. Khong cho ha nguoi ADMIN CUOI CUNG. Con it nhat mot admin thi luon con duong
     *    vao; het sach admin thi ai cung khong vao duoc nua.
     */
    public UserSummaryDto changeRole(long userId, String newRole, String actingEmail) {
        Role role;
        try {
            role = Role.valueOf(newRole);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid_role");
        }

        User target = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "user_not_found"));

        if (target.getEmail().equals(actingEmail) && role != Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "cannot_demote_self");
        }

        if (target.getRole() == Role.ADMIN && role != Role.ADMIN
                && userRepository.countByRole(Role.ADMIN) <= 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "last_admin");
        }

        target.setRole(role);
        userRepository.save(target);
        log.info("ADMIN {} doi vai tro cua {} thanh {}", actingEmail, target.getEmail(), role);

        return new UserSummaryDto(
                target.getId(), target.getEmail(), target.getRole().name(), target.getCreatedAt().toString());
    }
}
