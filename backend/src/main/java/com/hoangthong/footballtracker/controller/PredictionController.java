package com.hoangthong.footballtracker.controller;

import com.hoangthong.footballtracker.dto.BadgeDto;
import com.hoangthong.footballtracker.dto.LeaderboardEntryDto;
import com.hoangthong.footballtracker.dto.PredictableMatchDto;
import com.hoangthong.footballtracker.dto.PredictionHistoryDto;
import com.hoangthong.footballtracker.dto.PredictionRequest;
import com.hoangthong.footballtracker.service.BadgeService;
import com.hoangthong.footballtracker.service.PredictionService;
import com.hoangthong.footballtracker.service.WriteRateLimiter;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.List;

/**
 * Du doan ti so tran dau. Xem lich thi dau/BXH du doan khong can dang nhap;
 * gui du doan va xem lich su ca nhan can header "Authorization: Bearer <token>".
 */
@RestController
@RequestMapping("/api/predictions")
public class PredictionController {

    /*
     * Rong rai: mot vong dau co the co ca chuc tran o 6 giai, nguoi dung dat/sua lien
     * tuc trong mot phien la binh thuong. Nguong nay chi de chan script goi khong dut.
     */
    private static final int SUBMIT_PER_10MIN = 150;

    private final PredictionService predictionService;
    private final BadgeService badgeService;
    private final WriteRateLimiter limiter;

    public PredictionController(PredictionService predictionService, BadgeService badgeService,
                                WriteRateLimiter limiter) {
        this.predictionService = predictionService;
        this.badgeService = badgeService;
        this.limiter = limiter;
    }

    /**
     * Tran sap dien ra cua 1 giai. Neu da dang nhap, moi tran kem theo du doan hien tai
     * cua nguoi dung (null neu chua du doan). Endpoint cong khai nen KHONG bat buoc dang nhap.
     */
    @GetMapping("/matches/{code}")
    public List<PredictableMatchDto> getUpcomingMatches(@PathVariable String code, Authentication authentication) {
        return predictionService.getUpcomingMatches(code.toUpperCase(), currentEmailOrNull(authentication));
    }

    @PostMapping
    public ResponseEntity<Void> submitPrediction(
            @AuthenticationPrincipal String email, @RequestBody PredictionRequest request) {
        limiter.check("predict", email, SUBMIT_PER_10MIN, Duration.ofMinutes(10));
        predictionService.submitPrediction(email, request);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/mine")
    public List<PredictionHistoryDto> getMyHistory(@AuthenticationPrincipal String email) {
        return predictionService.getMyHistory(email);
    }

    /** Cac lan "Nhat tuan" cua toi - de chuong hien thong bao chuc mung. */
    @GetMapping("/champions/mine")
    public List<com.hoangthong.footballtracker.dto.WeeklyChampionDto> myChampions(
            @AuthenticationPrincipal String email) {
        return predictionService.myWeeklyChampions(email);
    }

    /** Dat / go x2 (nhan doi diem) cho du doan mot tran. Body: { matchId, doubled }. */
    @PostMapping("/double")
    public ResponseEntity<Void> setDouble(@AuthenticationPrincipal String email,
                                          @RequestBody java.util.Map<String, Object> body) {
        long matchId = ((Number) body.get("matchId")).longValue();
        boolean doubled = Boolean.TRUE.equals(body.get("doubled"));
        predictionService.setDouble(email, matchId, doubled);
        return ResponseEntity.noContent().build();
    }

    /** Tran dang dat x2 tuan nay (cho banner). 204 = chua dung luot tuan nay. */
    @GetMapping("/double/current-week")
    public ResponseEntity<com.hoangthong.footballtracker.dto.CurrentDoubleDto> currentWeekDouble(
            @AuthenticationPrincipal String email) {
        var dto = predictionService.currentWeekDouble(email);
        return dto == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(dto);
    }

    /** Huy hieu thanh tich cua toi (ca da dat va chua dat, kem tien do). */
    @GetMapping("/badges")
    public List<BadgeDto> getMyBadges(@AuthenticationPrincipal String email) {
        return badgeService.getBadgesForUser(email);
    }

    /** Huy hieu toi vua dat gan day - cho dong "chuc mung" tren chuong. */
    @GetMapping("/badges/recent")
    public List<com.hoangthong.footballtracker.dto.RecentBadgeDto> getRecentBadges(@AuthenticationPrincipal String email) {
        return badgeService.getRecentBadges(email);
    }

    /** Chon huy hieu ghim canh ten. Body: { "code": "PROPHET" } hoac { "code": null } de bo. */
    @org.springframework.web.bind.annotation.PostMapping("/badges/featured")
    public void setFeaturedBadge(@AuthenticationPrincipal String email,
                                 @RequestBody(required = false) java.util.Map<String, String> body) {
        limiter.check("badge-featured", email, 30, java.time.Duration.ofMinutes(1));
        badgeService.setFeaturedBadge(email, body == null ? null : body.get("code"));
    }

    /** Top nguoi du doan diem cao nhat (toan mua). Cong khai, ai cung xem duoc. */
    @GetMapping("/leaderboard")
    public List<LeaderboardEntryDto> getLeaderboard() {
        return predictionService.getLeaderboard();
    }

    /**
     * BXH du doan theo TUAN: chi tinh cac tran co gio bong lan trong [from, to).
     * Frontend tinh moc dau/cuoi tuan (theo mui gio nguoi xem) roi gui len. Cong khai.
     */
    @GetMapping("/leaderboard/period")
    public List<LeaderboardEntryDto> getLeaderboardForPeriod(
            @org.springframework.web.bind.annotation.RequestParam java.time.Instant from,
            @org.springframework.web.bind.annotation.RequestParam java.time.Instant to) {
        return predictionService.getLeaderboardBetween(from, to);
    }

    /**
     * Endpoint cong khai van chay JwtAuthFilter neu co token, nen principal co the la
     * "anonymousUser" (AnonymousAuthenticationFilter mac dinh cua Spring Security) khi
     * khong dang nhap. Chuan hoa ve null cho ro rang.
     */
    private String currentEmailOrNull(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        Object principal = authentication.getPrincipal();
        if (!(principal instanceof String email) || "anonymousUser".equals(email)) {
            return null;
        }
        return email;
    }
}
