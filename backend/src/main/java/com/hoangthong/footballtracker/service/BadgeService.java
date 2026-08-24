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
    private final com.hoangthong.footballtracker.repository.WeeklyChampionRepository weeklyChampionRepository;

    public BadgeService(
            PredictionRepository predictionRepository,
            UserBadgeRepository userBadgeRepository,
            UserRepository userRepository,
            com.hoangthong.footballtracker.repository.WeeklyChampionRepository weeklyChampionRepository) {
        this.predictionRepository = predictionRepository;
        this.userBadgeRepository = userBadgeRepository;
        this.userRepository = userRepository;
        this.weeklyChampionRepository = weeklyChampionRepository;
    }

    /** Goi tu PredictionScoringService sau khi cham diem xong cho 1 user. */
    public void evaluateBadgesForUser(Long userId) {
        evaluateAndAward(userId);
    }

    /** Toan bo badge (da dat + chua dat) kem tien do cua 1 user, dung cho FE hien thi. */
    public List<BadgeDto> getBadgesForUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Nguoi dung khong ton tai"));
        return getBadgesForUserId(user.getId());
    }

    /** Dung cho ho so cong khai: chi biet id, khong biet (va khong can) email. */
    public List<BadgeDto> getBadgesForUserId(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "user_not_found"));

        BadgeProgress p = evaluateAndAward(user.getId());

        Set<String> earnedCodes = userBadgeRepository.findByUserId(user.getId()).stream()
                .map(UserBadge::getBadgeCode)
                .collect(Collectors.toSet());

        // Thu tu tra ve = thu tu hien tren ho so: nhom theo chu de, de truoc kho sau
        return List.of(
                toDto(BadgeType.ROOKIE, p.correctCount(), earnedCodes),
                toDto(BadgeType.SHARP, p.correctCount(), earnedCodes),
                toDto(BadgeType.PROPHET, p.exactCount(), earnedCodes),
                toDto(BadgeType.ORACLE, p.exactCount(), earnedCodes),
                toDto(BadgeType.WIN_STREAK, p.bestStreak(), earnedCodes),
                toDto(BadgeType.ON_FIRE, p.bestStreak(), earnedCodes),
                toDto(BadgeType.CENTURION, p.totalPoints(), earnedCodes),
                toDto(BadgeType.WEEKLY_KING, p.weeklyWins(), earnedCodes)
        );
    }

    private BadgeProgress evaluateAndAward(Long userId) {
        List<Prediction> scored = predictionRepository.findScoredByUserIdOrderByMatchDateAsc(userId);

        // Diem = 3 hoac 6 la trung ti so (6 = trung ti so co dat x2). Diem > 0 la co diem.
        int correctCount = (int) scored.stream().filter(p -> p.getPoints() != null && p.getPoints() > 0).count();
        int exactCount = (int) scored.stream().filter(p -> p.getPoints() != null && (p.getPoints() == 3 || p.getPoints() == 6)).count();
        int totalPoints = scored.stream().mapToInt(p -> p.getPoints() == null ? 0 : p.getPoints()).sum();
        int bestStreak = bestCorrectStreak(scored);
        int weeklyWins = (int) weeklyChampionRepository.countByUserId(userId);

        awardIfEligible(userId, BadgeType.ROOKIE, correctCount >= BadgeType.ROOKIE.getThreshold());
        awardIfEligible(userId, BadgeType.SHARP, correctCount >= BadgeType.SHARP.getThreshold());
        awardIfEligible(userId, BadgeType.PROPHET, exactCount >= BadgeType.PROPHET.getThreshold());
        awardIfEligible(userId, BadgeType.ORACLE, exactCount >= BadgeType.ORACLE.getThreshold());
        awardIfEligible(userId, BadgeType.WIN_STREAK, bestStreak >= BadgeType.WIN_STREAK.getThreshold());
        awardIfEligible(userId, BadgeType.ON_FIRE, bestStreak >= BadgeType.ON_FIRE.getThreshold());
        awardIfEligible(userId, BadgeType.CENTURION, totalPoints >= BadgeType.CENTURION.getThreshold());
        awardIfEligible(userId, BadgeType.WEEKLY_KING, weeklyWins >= BadgeType.WEEKLY_KING.getThreshold());

        return new BadgeProgress(correctCount, exactCount, totalPoints, bestStreak, weeklyWins);
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

    private record BadgeProgress(int correctCount, int exactCount, int totalPoints, int bestStreak, int weeklyWins) {
    }
}
