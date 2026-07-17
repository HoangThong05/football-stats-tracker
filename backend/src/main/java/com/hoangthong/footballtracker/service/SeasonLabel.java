package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.client.dto.StandingsApiResponse;

import java.time.LocalDate;

/**
 * Suy ra nhan mua giai (vd "2025/26") tu Season ma football-data.org tra ve.
 * Can thiet vi API khong nhan tham so "season" tuong minh: ho tu chon "mua hien tai"
 * theo tung giai, co the khac nhau giua cac giai tai cung 1 thoi diem (vd PL da sang
 * mua moi nhung CL van con hien mua vua xong, tuy khi nao lich duoc cong bo).
 */
final class SeasonLabel {

    private SeasonLabel() {
    }

    static String of(StandingsApiResponse.Season season) {
        if (season == null || season.startDate() == null || season.endDate() == null) {
            return null;
        }
        try {
            int startYear = LocalDate.parse(season.startDate()).getYear();
            int endYear = LocalDate.parse(season.endDate()).getYear();
            if (startYear == endYear) {
                return String.valueOf(startYear);
            }
            return startYear + "/" + String.valueOf(endYear).substring(2);
        } catch (Exception ex) {
            return null;
        }
    }
}
