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
            String email,
            long totalPoints,
            /** So luot du doan da duoc cham diem (tran da ket thuc). */
            long scoredPredictions,
            /** So lan doan dung chinh xac ti so (3 diem). */
            long exactScores
    ) {}

    /** Du doan cua mot thanh vien cho mot tran. */
    public record MemberPick(String email, int homeScore, int awayScore, Integer points) {}

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

    /** BXH day du cua phong */
    public record LeagueLeaderboardResponse(
            Long leagueId,
            String leagueName,
            String inviteCode,
            List<LeagueLeaderboardEntry> entries
    ) {}
}
