package com.hoangthong.footballtracker.dto;

/**
 * Du lieu gon gang ma BACKEND cua ban tra ve cho frontend.
 * Chi giu nhung truong can hien thi tren bang xep hang.
 */
public record StandingRow(
        int position,
        String teamName,
        String crest,
        int playedGames,
        int won,
        int draw,
        int lost,
        int goalsFor,
        int goalsAgainst,
        int goalDifference,
        int points
) {
}
