package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.dto.PublicProfileDto;
import com.hoangthong.footballtracker.entity.User;
import com.hoangthong.footballtracker.repository.PredictionRepository;
import com.hoangthong.footballtracker.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * Ho so cong khai cua mot nguoi choi.
 *
 * Chi tra ve nhung gi von da hien o bang xep hang: ten, thanh tich, huy hieu.
 * KHONG co email - xem ghi chu o PublicProfileDto.
 */
@Service
public class PublicProfileService {

    private final UserRepository userRepository;
    private final PredictionRepository predictionRepository;
    private final BadgeService badgeService;
    private final FriendshipService friendshipService;
    private final com.hoangthong.footballtracker.repository.FavoriteTeamRepository favoriteRepository;

    public PublicProfileService(UserRepository userRepository,
                                PredictionRepository predictionRepository,
                                BadgeService badgeService,
                                FriendshipService friendshipService,
                                com.hoangthong.footballtracker.repository.FavoriteTeamRepository favoriteRepository) {
        this.friendshipService = friendshipService;
        this.userRepository = userRepository;
        this.predictionRepository = predictionRepository;
        this.badgeService = badgeService;
        this.favoriteRepository = favoriteRepository;
    }

    public PublicProfileDto get(long userId, String viewerEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "user_not_found"));

        var stats = predictionRepository.findProfileStats(userId);

        // Diem tung du doan da cham (cu -> moi) - de ve bieu do va tinh ti le co diem
        java.util.List<Integer> timeline = predictionRepository.findScoredPointsOrderByDate(userId);
        long hits = timeline.stream().filter(pt -> pt != null && pt > 0).count();
        int hitRate = timeline.isEmpty() ? 0 : (int) Math.round(hits * 100.0 / timeline.size());

        java.util.List<com.hoangthong.footballtracker.dto.FavoriteTeamDto> favorites =
                favoriteRepository.findByUserId(userId).stream()
                        .map(f -> new com.hoangthong.footballtracker.dto.FavoriteTeamDto(
                                f.getTeamId(), f.getTeamName(), f.getTeamCrest()))
                        .toList();

        return new PublicProfileDto(
                user.getId(),
                user.displayNameOrFallback(),
                user.getAvatarUrl(),
                user.getCreatedAt().toString(),
                stats == null || stats.getTotalPoints() == null ? 0 : stats.getTotalPoints(),
                stats == null || stats.getScored() == null ? 0 : stats.getScored(),
                stats == null || stats.getExactScores() == null ? 0 : stats.getExactScores(),
                hitRate,
                friendshipService.friendsCount(userId),
                favorites,
                timeline,
                badgeService.getBadgesForUserId(userId),
                friendshipService.relationWith(viewerEmail, userId).name());
    }
}
