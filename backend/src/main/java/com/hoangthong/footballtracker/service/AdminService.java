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
    private final com.hoangthong.footballtracker.repository.PostReportRepository reportRepository;
    private final com.hoangthong.footballtracker.repository.AnnouncementRepository announcementRepository;
    private final WebPushService webPush;

    public AdminService(
            UserRepository userRepository,
            PredictionRepository predictionRepository,
            MiniLeagueRepository miniLeagueRepository,
            MatchFixtureRepository matchFixtureRepository,
            CacheManager cacheManager,
            ApiQuotaTracker quotaTracker,
            MatchSyncService matchSyncService,
            com.hoangthong.footballtracker.repository.PostReportRepository reportRepository,
            com.hoangthong.footballtracker.repository.AnnouncementRepository announcementRepository,
            WebPushService webPush) {
        this.userRepository = userRepository;
        this.predictionRepository = predictionRepository;
        this.miniLeagueRepository = miniLeagueRepository;
        this.matchFixtureRepository = matchFixtureRepository;
        this.cacheManager = cacheManager;
        this.quotaTracker = quotaTracker;
        this.matchSyncService = matchSyncService;
        this.reportRepository = reportRepository;
        this.announcementRepository = announcementRepository;
        this.webPush = webPush;
    }

    /**
     * ADMIN gui mot thong bao toan he thong: luu lai (hien tren chuong moi nguoi) + day push.
     *
     * @return so nguoi da duoc day push (co dang ky thiet bi)
     */
    @org.springframework.transaction.annotation.Transactional
    public int broadcast(String rawTitle, String rawBody) {
        String title = rawTitle == null ? "" : rawTitle.trim();
        String body = rawBody == null ? "" : rawBody.trim();
        if (title.isEmpty() || body.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "announcement_empty");
        }
        if (title.length() > com.hoangthong.footballtracker.entity.Announcement.MAX_TITLE
                || body.length() > com.hoangthong.footballtracker.entity.Announcement.MAX_BODY) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "announcement_too_long");
        }
        announcementRepository.save(new com.hoangthong.footballtracker.entity.Announcement(title, body));
        int sent = 0;
        for (User u : userRepository.findAll()) {
            webPush.sendToUser(u, "📢 " + title, body, "/");
            sent++;
        }
        return sent;
    }

    public List<UserSummaryDto> listUsers() {
        // Nguoi dang ky MOI nhat len dau (null createdAt xuong cuoi cho chac)
        return userRepository.findAll().stream()
                .sorted(java.util.Comparator.comparing(User::getCreatedAt,
                        java.util.Comparator.nullsFirst(java.util.Comparator.naturalOrder())).reversed())
                .map(AdminService::toDto).toList();
    }

    /** Hang doi kiem duyet: cac bai bi bao cao (chua bi an), nhieu bao cao len dau. */
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<com.hoangthong.footballtracker.dto.ReportedPostDto> reportedPosts() {
        // Gom theo bai: dem so bao cao, gom ly do, giu lan bao cao moi nhat
        java.util.Map<Long, java.util.List<com.hoangthong.footballtracker.entity.PostReport>> byPost =
                new java.util.LinkedHashMap<>();
        for (var r : reportRepository.findPending()) {
            byPost.computeIfAbsent(r.getPost().getId(), k -> new java.util.ArrayList<>()).add(r);
        }
        List<com.hoangthong.footballtracker.dto.ReportedPostDto> out = new java.util.ArrayList<>();
        for (var entry : byPost.entrySet()) {
            var reports = entry.getValue();
            var post = reports.get(0).getPost();
            var reasons = reports.stream()
                    .map(com.hoangthong.footballtracker.entity.PostReport::getReason)
                    .filter(s -> s != null && !s.isBlank())
                    .toList();
            var last = reports.stream()
                    .map(com.hoangthong.footballtracker.entity.PostReport::getCreatedAt)
                    .max(java.util.Comparator.naturalOrder()).orElse(post.getCreatedAt());
            out.add(new com.hoangthong.footballtracker.dto.ReportedPostDto(
                    post.getId(),
                    post.getAuthor().displayNameOrFallback(),
                    post.getAuthor().getAvatarUrl(),
                    reportExcerpt(post.getContent()),
                    reports.size(),
                    reasons,
                    last.toString()));
        }
        out.sort(java.util.Comparator.comparingInt(
                com.hoangthong.footballtracker.dto.ReportedPostDto::reportCount).reversed());
        return out;
    }

    /** Bo qua bao cao cua mot bai (khong go bai) - xoa cac dong bao cao de no roi khoi hang doi. */
    @org.springframework.transaction.annotation.Transactional
    public void dismissReports(long postId) {
        reportRepository.deleteByPostId(postId);
    }

    private static String reportExcerpt(String content) {
        if (content == null || content.isBlank()) {
            return "";
        }
        String flat = Mentions.toDisplay(content).strip().replaceAll("\\s+", " ");
        return flat.length() <= 120 ? flat : flat.substring(0, 120) + "…";
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

        return toDto(target);
    }

    /**
     * Khoa hoac mo tai khoan.
     *
     * Khong cho tu khoa CHINH MINH - bam nham la mat quyen vao ngay lap tuc, va vi
     * chinh minh khong bao gio bi khoa nen luon con it nhat mot admin dang nhap duoc.
     * Nho vay khong can them chot "admin cuoi cung" rieng cho viec khoa.
     */
    public UserSummaryDto setEnabled(long userId, boolean enabled, String actingEmail) {
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "user_not_found"));

        if (target.getEmail().equals(actingEmail) && !enabled) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "cannot_disable_self");
        }

        target.setEnabled(enabled);
        userRepository.save(target);
        log.info("ADMIN {} {} tai khoan {}", actingEmail, enabled ? "mo" : "khoa", target.getEmail());

        return toDto(target);
    }

    private static UserSummaryDto toDto(User u) {
        return new UserSummaryDto(
                u.getId(), u.getEmail(), u.getRole().name(), u.getCreatedAt().toString(), u.isEnabled());
    }
}
