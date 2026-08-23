package com.hoangthong.footballtracker.dto;

/** Tran dang duoc dat x2 trong TUAN NAY - de tab Du doan hien banner. null = chua dung. */
public record CurrentDoubleDto(long matchId, String competition, String homeTeam, String awayTeam) {
}
