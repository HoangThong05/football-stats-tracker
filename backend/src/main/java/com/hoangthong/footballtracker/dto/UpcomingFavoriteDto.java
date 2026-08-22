package com.hoangthong.footballtracker.dto;

import java.time.Instant;

/**
 * Mot tran sap dien ra cua doi ma nguoi dung dang theo doi.
 *
 * @param followedTeamName ten doi NGUOI DUNG THEO DOI (mot trong hai doi duoi day).
 *                         Can no de noi ro "vi sao ban nhan duoc nhac nay" - theo doi
 *                         nhieu doi thi nhin cap dau khong doan duoc doi nao la cua minh.
 *                         null = tran nay vao danh sach vi nguoi dung DA DU DOAN no,
 *                         khong phai vi theo doi doi nao.
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
        Integer awayScore,
        /** Du doan cua chinh nguoi dung cho tran nay. null = khong dat du doan. */
        Integer myHomeScore,
        Integer myAwayScore,
        /** Diem nhan duoc. null = tran chua duoc cham diem. */
        Integer myPoints
) {
    /** Tran da ket thuc -> hien ti so thay vi dem nguoc gio. */
    public boolean finished() {
        return "FINISHED".equals(status);
    }
}
