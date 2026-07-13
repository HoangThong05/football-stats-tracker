package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.dto.BadgeDto;
import com.hoangthong.footballtracker.entity.Prediction;
import com.hoangthong.footballtracker.entity.User;
import com.hoangthong.footballtracker.entity.UserBadge;
import com.hoangthong.footballtracker.repository.PredictionRepository;
import com.hoangthong.footballtracker.repository.UserBadgeRepository;
import com.hoangthong.footballtracker.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Huy hieu (badge) thanh tich du doan - xem cac loai va nguong o BadgeType.
 * Danh gia + cap badge moi (idempotent, khong cap lai badge da co) o 2 noi:
 * ngay sau khi PredictionScoringService cham diem xong 1 dot, va moi khi user
 * xem trang lich su (tu-cham-lai de khong phai cho toi lan chay job ke tiep).
 */
@Service
public class BadgeService {

    private static final Logger log = LoggerFactory.getLogger(BadgeService.class);

    private final PredictionRepository predictionRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final UserRepository userRepository;

    public BadgeService(
            PredictionRepository predictionRepository,
            UserBadgeRepository userBadgeRepository,
            UserRepository userRepository) {
        this.predictionRepository = predictionRepository;
        this.userBadgeRepository = userBadgeRepository;
        this.userRepository = userRepository;
    }

    /** Goi tu PredictionScoringService sau khi cham diem xong cho 1 user. */
    public void evaluateBadgesForUser(Long userId) {
        evaluateAndAward(userId);
    }

    /** Toan bo badge (da dat + chua dat) kem tien do cua 1 user, dung cho FE hien thi. */
    public List<BadgeDto> getBadgesForUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Nguoi dung khong ton tai"));

        BadgeProgress progress = evaluateAndAward(user.getId());

        Set<String> earnedCodes = userBadgeRepository.findByUserId(user.getId()).stream()
                .map(UserBadge::getBadgeCode)
                .collect(Collectors.toSet());

        return List.of(
                toDto(BadgeType.PROPHET, progress.exactCount(), earnedCodes),
                toDto(BadgeType.WIN_STREAK, progress.bestStreak(), earnedCodes)
        );
    }

    private BadgeProgress evaluateAndAward(Long userId) {
        List<Prediction> scored = predictionRepository.findScoredByUserIdOrderByMatchDateAsc(userId);

        int exactCount = (int) scored.stream().filter(p -> p.getPoints() == 3).count();
        int bestStreak = bestCorrectStreak(scored);

        awardIfEligible(userId, BadgeType.PROPHET, exactCount >= BadgeType.PROPHET.getThreshold());
        awardIfEligible(userId, BadgeType.WIN_STREAK, bestStreak >= BadgeType.WIN_STREAK.getThreshold());

        return new BadgeProgress(exactCount, bestStreak);
    }

    /** Chuoi dai nhat cac du doan LIEN TIEP (theo thoi gian tran) co diem > 0 (dung ket qua hoac chinh xac ti so). */
    private int bestCorrectStreak(List<Prediction> scoredChronological) {
        int best = 0;
        int current = 0;
        for (Prediction p : scoredChronological) {
            if (p.getPoints() != null && p.getPoints() > 0) {
                current++;
                best = Math.max(best, current);
            } else {
                current = 0;
            }
        }
        return best;
    }

    private void awardIfEligible(Long userId, BadgeType type, boolean eligible) {
        if (!eligible || userBadgeRepository.existsByUserIdAndBadgeCode(userId, type.name())) {
            return;
        }
        User ref = userRepository.getReferenceById(userId);
        userBadgeRepository.save(new UserBadge(ref, type.name()));
        log.info("User {} vua dat badge {}", userId, type.name());
    }

    private BadgeDto toDto(BadgeType type, int progress, Set<String> earnedCodes) {
        return new BadgeDto(type.name(), earnedCodes.contains(type.name()), Math.min(progress, type.getThreshold()), type.getThreshold());
    }

    private record BadgeProgress(int exactCount, int bestStreak) {
    }
}
