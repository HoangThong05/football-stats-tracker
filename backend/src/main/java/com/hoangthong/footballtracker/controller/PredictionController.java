package com.hoangthong.footballtracker.controller;

import com.hoangthong.footballtracker.dto.LeaderboardEntryDto;
import com.hoangthong.footballtracker.dto.PredictableMatchDto;
import com.hoangthong.footballtracker.dto.PredictionHistoryDto;
import com.hoangthong.footballtracker.dto.PredictionRequest;
import com.hoangthong.footballtracker.service.PredictionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Du doan ti so tran dau. Xem lich thi dau/BXH du doan khong can dang nhap;
 * gui du doan va xem lich su ca nhan can header "Authorization: Bearer <token>".
 */
@RestController
@RequestMapping("/api/predictions")
public class PredictionController {

    private final PredictionService predictionService;

    public PredictionController(PredictionService predictionService) {
        this.predictionService = predictionService;
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
        predictionService.submitPrediction(email, request);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/mine")
    public List<PredictionHistoryDto> getMyHistory(@AuthenticationPrincipal String email) {
        return predictionService.getMyHistory(email);
    }

    /** Top nguoi du doan diem cao nhat. Cong khai, ai cung xem duoc. */
    @GetMapping("/leaderboard")
    public List<LeaderboardEntryDto> getLeaderboard() {
        return predictionService.getLeaderboard();
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
