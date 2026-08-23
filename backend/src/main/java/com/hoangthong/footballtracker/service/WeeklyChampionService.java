package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.entity.WeeklyChampion;
import com.hoangthong.footballtracker.repository.PredictionRepository;
import com.hoangthong.footballtracker.repository.WeeklyChampionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.TemporalAdjusters;

/**
 * Trao danh hieu "Nhat tuan" cho nguoi du doan diem cao nhat cua TUAN VUA KET THUC.
 *
 * Chay dinh ky (mac dinh 6 gio/lan). Moi lan chi xet TUAN GAN NHAT DA XONG (thu 2 -> chu
 * nhat da qua het). Da trao roi thi thoi - nho existsByWeekStart. Nho UptimeRobot giu
 * server thuc, job nay chay dang tin du Render goi free hay ngu khi khong ai dung.
 *
 * Tuan tinh theo gio VN de co MOT moc chuan phia may chu (frontend hien BXH tuan theo gio
 * nguoi xem - lech vai gio voi nguoi ngoai VN, chap nhan duoc voi app huong nguoi Viet).
 */
@Service
public class WeeklyChampionService {

    private static final Logger log = LoggerFactory.getLogger(WeeklyChampionService.class);
    private static final ZoneId VN = ZoneId.of("Asia/Ho_Chi_Minh");

    private final PredictionRepository predictionRepository;
    private final WeeklyChampionRepository championRepository;

    public WeeklyChampionService(PredictionRepository predictionRepository,
                                 WeeklyChampionRepository championRepository) {
        this.predictionRepository = predictionRepository;
        this.championRepository = championRepository;
    }

    @Scheduled(
            initialDelayString = "${app.champion.initial-delay-ms:60000}",
            fixedDelayString = "${app.champion.interval-ms:21600000}")
    @Transactional
    public void awardLastCompletedWeek() {
        ZonedDateTime now = ZonedDateTime.now(VN);
        LocalDate thisMonday = now.toLocalDate().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate lastMonday = thisMonday.minusWeeks(1);

        Instant from = lastMonday.atStartOfDay(VN).toInstant();   // thu 2 tuan truoc, 00:00 VN
        Instant to = thisMonday.atStartOfDay(VN).toInstant();     // thu 2 tuan nay (moc cuoi, khong bao gom)

        if (championRepository.existsByWeekStart(from)) {
            return; // da trao tuan nay roi
        }

        var rows = predictionRepository.findLeaderboardBetween(from, to);
        if (rows.isEmpty() || rows.get(0).getTotalPoints() == null) {
            return; // tuan do khong ai duoc cham diem
        }
        long max = rows.get(0).getTotalPoints(); // query da sap giam dan
        if (max <= 0) {
            return; // co du doan nhung khong ai duoc diem duong
        }

        int awarded = 0;
        for (var row : rows) {
            Long pts = row.getTotalPoints();
            if (pts == null || pts != max) {
                break; // da qua nhung nguoi cao diem nhat (rows sap giam dan)
            }
            championRepository.save(new WeeklyChampion(row.getUserId(), from, (int) max));
            awarded++;
        }
        log.info("Trao Nhat tuan {} cho {} nguoi, {} diem", lastMonday, awarded, max);
    }
}
