package com.hoangthong.footballtracker.dto;

/**
 * 1 tran dau tren trang "Hom nay" (tong hop moi giai).
 * Khac MatchDto o cho co them "competition" - vi trang nay gop nhieu giai,
 * frontend can biet tran thuoc giai nao de nhom lai.
 */
public record DayMatchDto(
        long id,
        String competition,
        String utcDate,
        String status,
        Integer matchday,
        String homeTeam,
        String homeCrest,
        String awayTeam,
        String awayCrest,
        Integer homeScore,
        Integer awayScore
) {
}
