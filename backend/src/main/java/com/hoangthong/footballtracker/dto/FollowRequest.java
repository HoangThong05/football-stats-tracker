package com.hoangthong.footballtracker.dto;

/**
 * Frontend da co san teamId/teamName/teamCrest tu bang xep hang,
 * gui thang len day thay vi backend phai goi lai football-data.org.
 */
public record FollowRequest(long teamId, String teamName, String teamCrest) {
}
