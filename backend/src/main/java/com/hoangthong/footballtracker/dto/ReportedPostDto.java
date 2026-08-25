package com.hoangthong.footballtracker.dto;

import java.util.List;

/**
 * Mot bai bi bao cao - mot dong trong hang doi kiem duyet cua admin.
 *
 * @param reportCount    so luot bao cao (nhieu nguoi cang dang lo ngai)
 * @param reasons        cac ly do kem theo (co the rong neu nguoi bao cao khong ghi)
 * @param lastReportedAt lan bao cao gan nhat
 */
public record ReportedPostDto(long postId, String authorName, String authorAvatar,
                              String excerpt, int reportCount, List<String> reasons,
                              String lastReportedAt) {
}
