package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.entity.User;
import com.hoangthong.footballtracker.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Trang thai "dang hoat dong" (cham xanh) kieu Facebook.
 *
 * Moc "vua thay online" giu TRONG BO NHO (khong ghi DB moi nhip tim) - nhe cho database,
 * va mat khi may chu ngu/khoi dong lai cung khong sao: nguoi dung online se ping lai sau
 * vai chuc giay. Rieng tuy chon BAT/TAT hien trang thai thi luu ben User (lau dai).
 */
@Service
public class PresenceService {

    /** Ping trong vong ngan nay coi la dang online. Frontend ping ~60s/lan. */
    private static final Duration ONLINE_WINDOW = Duration.ofMinutes(2);

    private final UserRepository userRepo;
    private final Map<Long, Instant> lastSeen = new ConcurrentHashMap<>();

    public PresenceService(UserRepository userRepo) {
        this.userRepo = userRepo;
    }

    /** Nhip tim: danh dau nguoi nay vua hoat dong. */
    public void ping(String email) {
        userRepo.findByEmail(email).ifPresent(u -> lastSeen.put(u.getId(), Instant.now()));
    }

    /**
     * Trang thai cua cac id hoi - chi cho nhung nguoi CHO PHEP hien va da tung online
     * (co moc trong bo nho). online = trong 2 phut; nguoc lai xam + kem moc "lan cuoi".
     */
    public List<com.hoangthong.footballtracker.dto.PresenceDto> statusAmong(Collection<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        Instant cutoff = Instant.now().minus(ONLINE_WINDOW);
        List<com.hoangthong.footballtracker.dto.PresenceDto> out = new java.util.ArrayList<>();
        for (User u : userRepo.findAllById(ids)) {
            if (!u.isShowOnlineStatus()) {
                continue;
            }
            Instant seen = lastSeen.get(u.getId());
            if (seen == null) {
                continue; // chua tung thay trong phien nay -> khong hien cham
            }
            out.add(new com.hoangthong.footballtracker.dto.PresenceDto(
                    u.getId(), seen.isAfter(cutoff), seen.toString()));
        }
        return out;
    }

    /** Tuy chon hien trang thai cua chinh minh. */
    public boolean getSetting(String email) {
        return getUser(email).isShowOnlineStatus();
    }

    @Transactional
    public boolean setSetting(String email, boolean enabled) {
        User me = getUser(email);
        me.setShowOnlineStatus(enabled);
        userRepo.save(me);
        return enabled;
    }

    private User getUser(String email) {
        return userRepo.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid_credentials"));
    }
}
