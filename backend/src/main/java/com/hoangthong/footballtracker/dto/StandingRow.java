package com.hoangthong.footballtracker.dto;

/**
 * Du lieu gon gang ma BACKEND cua ban tra ve cho frontend.
 * Chi giu nhung truong can hien thi tren bang xep hang.
 */
public record StandingRow(
        int position,
        long teamId,
        String teamName,
        String crest,
        int playedGames,
        int won,
        int draw,
        int lost,
        int goalsFor,
        int goalsAgainst,
        int goalDifference,
        int points,
        /** Phong do 5 tran gan nhat: "W,D,L,W,W" (cu -> moi). Null neu chua co du lieu. */
        String form
) {
}
