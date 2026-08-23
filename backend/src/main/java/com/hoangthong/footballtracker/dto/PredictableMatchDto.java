package com.hoangthong.footballtracker.dto;

/**
 * 1 tran sap dien ra, kem du doan hien tai cua user dang dang nhap (null neu
 * chua du doan hoac chua dang nhap).
 */
public record PredictableMatchDto(
        long matchId,
        String utcDate,
        Integer matchday,
        String homeTeam,
        String homeCrest,
        String awayTeam,
        String awayCrest,
        Integer myHomeScore,
        Integer myAwayScore,
        /** true = du doan cua toi cho tran nay dang duoc dat x2. */
        boolean myDoubled,
        /** true = tran nam trong TUAN NAY (gio VN) va chua bat dau -> duoc dat x2. */
        boolean weekEligible
) {
}
