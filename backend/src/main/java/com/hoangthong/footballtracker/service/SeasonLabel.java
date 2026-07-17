package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.client.dto.StandingsApiResponse;

import java.time.LocalDate;

/**
 * Suy ra nhan mua giai (vd "2025/26") tu Season ma football-data.org tra ve.
 * Can thiet vi API khong nhan tham so "season" tuong minh: ho tu chon "mua hien tai"
 * theo tung giai, co the khac nhau giua cac giai tai cung 1 thoi diem (vd PL da sang
 * mua moi nhung CL van con hien mua vua xong, tuy khi nao lich duoc cong bo).
 *
 * Da phat hien 1 kieu LECH DU LIEU tu phia football-data.org: object "season" da tro
 * toi mua MOI (startDate o tuong lai) nhung bang xep hang/vua pha luoi thuc te van la
 * so lieu mua VUA XONG (co playedGames/playedMatches > 0). Truong hop nay, "season"
 * dang noi doi - ta lui lai dung 1 nam de khop voi du lieu that dang hien thi.
 */
final class SeasonLabel {

    private SeasonLabel() {
    }

    /**
     * @param anyDataPlayed true neu bang/danh sach dang co it nhat 1 dong voi so tran da da > 0
     *                      (dung de phat hien lech du lieu noi tren).
     */
    static String of(StandingsApiResponse.Season season, boolean anyDataPlayed) {
        if (season == null || season.startDate() == null || season.endDate() == null) {
            return null;
        }
        try {
            LocalDate start = LocalDate.parse(season.startDate());
            LocalDate end = LocalDate.parse(season.endDate());

            if (anyDataPlayed && LocalDate.now().isBefore(start)) {
                start = start.minusYears(1);
                end = end.minusYears(1);
            }

            int startYear = start.getYear();
            int endYear = end.getYear();
            if (startYear == endYear) {
                return String.valueOf(startYear);
            }
            return startYear + "/" + String.valueOf(endYear).substring(2);
        } catch (Exception ex) {
            return null;
        }
    }
}
