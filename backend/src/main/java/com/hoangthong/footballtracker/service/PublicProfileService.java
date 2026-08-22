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

    public PublicProfileService(UserRepository userRepository,
                                PredictionRepository predictionRepository,
                                BadgeService badgeService,
                                FriendshipService friendshipService) {
        this.friendshipService = friendshipService;
        this.userRepository = userRepository;
        this.predictionRepository = predictionRepository;
        this.badgeService = badgeService;
    }

    public PublicProfileDto get(long userId, String viewerEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "user_not_found"));

        var stats = predictionRepository.findProfileStats(userId);

        return new PublicProfileDto(
                user.getId(),
                user.displayNameOrFallback(),
                user.getCreatedAt().toString(),
                stats == null || stats.getTotalPoints() == null ? 0 : stats.getTotalPoints(),
                stats == null || stats.getScored() == null ? 0 : stats.getScored(),
                stats == null || stats.getExactScores() == null ? 0 : stats.getExactScores(),
                badgeService.getBadgesForUserId(userId),
                friendshipService.relationWith(viewerEmail, userId).name());
    }
}
