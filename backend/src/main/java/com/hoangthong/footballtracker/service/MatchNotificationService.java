package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.entity.FavoriteTeam;
import com.hoangthong.footballtracker.entity.MatchFixture;
import com.hoangthong.footballtracker.entity.SentNotification;
import com.hoangthong.footballtracker.entity.User;
import com.hoangthong.footballtracker.repository.FavoriteTeamRepository;
import com.hoangthong.footballtracker.repository.MatchFixtureRepository;
import com.hoangthong.footballtracker.repository.SentNotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Job dinh ky: tim cac tran SAP DIEN RA (trong X gio toi) co doi ma nguoi dung dang theo doi,
 * gui email nhac nho. Doc tran tu DB (do MatchSyncService dong bo), khong goi lai API ngoai.
 */
@Service
public class MatchNotificationService {

    private static final Logger log = LoggerFactory.getLogger(MatchNotificationService.class);

    private static final List<String> UPCOMING_STATUSES = List.of("SCHEDULED", "TIMED");
    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter VN_FORMAT =
            DateTimeFormatter.ofPattern("HH:mm 'ngay' dd/MM/yyyy").withZone(VN_ZONE);

    private final MatchFixtureRepository matchRepository;
    private final FavoriteTeamRepository favoriteRepository;
    private final SentNotificationRepository sentRepository;
    private final EmailService emailService;

    // Bao truoc bao nhieu gio truoc gio bong lan (mac dinh 24h).
    private final long windowHours;

    public MatchNotificationService(
            MatchFixtureRepository matchRepository,
            FavoriteTeamRepository favoriteRepository,
            SentNotificationRepository sentRepository,
            EmailService emailService,
            @org.springframework.beans.factory.annotation.Value("${app.notify.window-hours:24}") long windowHours) {
        this.matchRepository = matchRepository;
        this.favoriteRepository = favoriteRepository;
        this.sentRepository = sentRepository;
        this.emailService = emailService;
        this.windowHours = windowHours;
    }

    @Scheduled(
            initialDelayString = "${app.notify.initial-delay-ms:30000}",
            fixedDelayString = "${app.notify.interval-ms:3600000}")
    public void notifyUpcomingMatches() {
        Instant now = Instant.now();
        Instant until = now.plus(Duration.ofHours(windowHours));

        List<MatchFixture> upcoming =
                matchRepository.findByStatusInAndUtcDateBetween(UPCOMING_STATUSES, now, until);
        if (upcoming.isEmpty()) {
            return;
        }

        // Gom tat ca team id xuat hien trong cac tran sap da de query 1 lan.
        Set<Long> teamIds = new HashSet<>();
        for (MatchFixture m : upcoming) {
            teamIds.add(m.getHomeTeamId());
            teamIds.add(m.getAwayTeamId());
        }

        List<FavoriteTeam> follows = favoriteRepository.findByTeamIdIn(teamIds);
        if (follows.isEmpty()) {
            return;
        }

        int sent = 0;
        for (MatchFixture match : upcoming) {
            for (FavoriteTeam follow : follows) {
                boolean involvesTeam = follow.getTeamId() == match.getHomeTeamId()
                        || follow.getTeamId() == match.getAwayTeamId();
                if (!involvesTeam) {
                    continue;
                }

                User user = follow.getUser();
                if (sentRepository.existsByUserIdAndMatchId(user.getId(), match.getId())) {
                    continue; // da gui roi
                }

                if (sendMatchEmail(user, follow, match)) {
                    sentRepository.save(new SentNotification(user.getId(), match.getId()));
                    sent++;
                }
            }
        }

        if (sent > 0) {
            log.info("Da gui {} email nhac tran sap dien ra.", sent);
        }
    }

    private boolean sendMatchEmail(User user, FavoriteTeam follow, MatchFixture match) {
        String kickoff = VN_FORMAT.format(match.getUtcDate());
        String subject = "⚽ " + follow.getTeamName() + " sap thi dau!";
        String body = """
                Xin chao,

                Doi ban theo doi - %s - sap co tran dau:

                  %s  vs  %s
                  Thoi gian: %s (gio Viet Nam)

                Dung bo lo nhe!

                -- Football Stats Tracker
                """.formatted(follow.getTeamName(), match.getHomeTeam(), match.getAwayTeam(), kickoff);

        return emailService.send(user.getEmail(), subject, body);
    }
}
