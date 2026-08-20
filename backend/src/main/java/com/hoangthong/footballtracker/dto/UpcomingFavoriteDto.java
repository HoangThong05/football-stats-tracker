package com.hoangthong.footballtracker.dto;

import java.time.Instant;

/**
 * Mot tran sap dien ra cua doi ma nguoi dung dang theo doi.
 *
 * @param followedTeamName ten doi NGUOI DUNG THEO DOI (mot trong hai doi duoi day).
 *                         Can no de noi ro "vi sao ban nhan duoc nhac nay" - theo doi
 *                         nhieu doi thi nhin cap dau khong doan duoc doi nao la cua minh.
 */
public record UpcomingFavoriteDto(
        long matchId,
        String competition,
        Instant utcDate,
        long followedTeamId,
        String followedTeamName,
        long homeTeamId,
        String homeTeam,
        String homeCrest,
        long awayTeamId,
        String awayTeam,
        String awayCrest,
        String status,
        Integer homeScore,
        Integer awayScore
) {
    /** Tran da ket thuc -> hien ti so thay vi dem nguoc gio. */
    public boolean finished() {
        return "FINISHED".equals(status);
    }
}
