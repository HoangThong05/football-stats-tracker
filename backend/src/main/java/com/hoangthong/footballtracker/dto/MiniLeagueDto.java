package com.hoangthong.footballtracker.dto;

import java.time.Instant;
import java.util.List;

public class MiniLeagueDto {

    /** Request tao phong moi */
    public record CreateLeagueRequest(String name) {}

    /** Request tham gia bang ma moi */
    public record JoinLeagueRequest(String inviteCode) {}

    /** Thong tin phong tra ve cho frontend */
    public record LeagueResponse(
            Long id,
            String name,
            String inviteCode,
            String ownerEmail,
            int memberCount,
            Instant createdAt,
            boolean isOwner
    ) {}

    /** 1 hang trong BXH cua phong */
    public record LeagueLeaderboardEntry(
            int rank,
            long userId,
            /** Ten hien thi, khong phai email - xem ghi chu o LeaderboardEntryDto. */
            String name,
            /** Ma huy hieu ghim canh ten. null = khong ghim. */
            String featuredBadge,
            long totalPoints,
            /** So luot du doan da duoc cham diem (tran da ket thuc). */
            long scoredPredictions,
            /** So lan doan dung chinh xac ti so (3 diem). */
            long exactScores
    ) {}

    /** Du doan cua mot thanh vien cho mot tran. */
    public record MemberPick(long userId, String name, String featuredBadge,
                             int homeScore, int awayScore, Integer points) {}

    /**
     * Mot tran kem du doan cua ca phong.
     *
     * CHI tra ve cho tran DA LAN BANH - xem ghi chu o PredictionRepository.findRevealedForUsers.
     */
    public record RoomMatchPicks(
            long matchId,
            String competition,
            Instant utcDate,
            String homeTeam,
            String homeCrest,
            String awayTeam,
            String awayCrest,
            Integer actualHomeScore,
            Integer actualAwayScore,
            String status,
            List<MemberPick> picks
    ) {}

    /** Mot tin nhan trong phong. */
    public record RoomMessageDto(long id, long authorId, String authorName,
                                 /** Anh dai dien cua nguoi nhan. null = chua dat. */
                                 String authorAvatar,
                                 /** Ma huy hieu nguoi nhan ghim canh ten. null = khong ghim. */
                                 String authorBadge,
                                 String content,
                                 /** Anh/GIF dinh kem. null = khong co. */
                                 String imageUrl,
                                 Instant createdAt) {}

    /** BXH day du cua phong */
    public record LeagueLeaderboardResponse(
            Long leagueId,
            String leagueName,
            String inviteCode,
            List<LeagueLeaderboardEntry> entries
    ) {}
}
