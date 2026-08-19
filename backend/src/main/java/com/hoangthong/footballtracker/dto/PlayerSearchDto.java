package com.hoangthong.footballtracker.dto;

/** Mot dong ket qua tim kiem cau thu. */
public record PlayerSearchDto(
        long id,
        String name,
        String position,
        String nationality,
        Integer age,
        long teamId,
        String teamName,
        String teamCrest,
        String leagueCode
) {
}
