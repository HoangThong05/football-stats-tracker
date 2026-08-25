package com.hoangthong.footballtracker.dto;

/**
 * Trang thai hoat dong cua mot nguoi (chi tra ve cho nguoi CHO PHEP hien).
 *
 * @param online   true = vua hoat dong trong vai phut -> cham xanh; false -> cham xam
 * @param lastSeen moc online gan nhat (ISO) - de hien "Hoat dong X phut truoc"
 */
public record PresenceDto(long id, boolean online, String lastSeen) {
}
