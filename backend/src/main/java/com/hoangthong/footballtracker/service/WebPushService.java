package com.hoangthong.footballtracker.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hoangthong.footballtracker.entity.PushSubscription;
import com.hoangthong.footballtracker.entity.User;
import com.hoangthong.footballtracker.repository.PushSubscriptionRepository;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import org.apache.http.HttpResponse;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.Security;
import java.util.List;
import java.util.Map;

/**
 * Gui thong bao day (Web Push) toi cac thiet bi da dang ky cua mot nguoi.
 *
 * Dung giao thuc VAPID: chi can cap khoa cong khai/bi mat dat o bien moi truong, khong
 * phu thuoc dich vu ben thu ba nao (Firebase...). Trinh duyet nhan day roi service worker
 * (sw.js) hien thong bao len.
 *
 * Neu chua cau hinh khoa VAPID thi service TAT han: moi lenh gui la khong lam gi, app van
 * chay binh thuong - de moi truong dev/local khong bat buoc phai co khoa.
 */
@Service
public class WebPushService {

    private static final Logger log = LoggerFactory.getLogger(WebPushService.class);

    private final PushSubscriptionRepository repo;
    private final ObjectMapper mapper = new ObjectMapper();

    /** Khoa cong khai - frontend can de dang ky (tra qua endpoint /api/push/public-key). */
    private final String publicKey;
    private final boolean enabled;
    private PushService pushService;

    public WebPushService(
            PushSubscriptionRepository repo,
            @Value("${app.push.vapid.public-key:}") String publicKey,
            @Value("${app.push.vapid.private-key:}") String privateKey,
            @Value("${app.push.vapid.subject:mailto:footballstatstracker@gmail.com}") String subject) {
        this.repo = repo;
        this.publicKey = publicKey == null ? "" : publicKey.trim();

        if (this.publicKey.isBlank() || privateKey == null || privateKey.isBlank()) {
            this.enabled = false;
            log.info("Web Push: chua cau hinh khoa VAPID -> tat (app van chay binh thuong).");
            return;
        }

        boolean ok = false;
        try {
            // web-push-java can provider "BC" cua BouncyCastle de ma hoa payload
            if (Security.getProvider("BC") == null) {
                Security.addProvider(new BouncyCastleProvider());
            }
            this.pushService = new PushService(this.publicKey, privateKey.trim(), subject);
            ok = true;
            log.info("Web Push: da san sang.");
        } catch (Exception e) {
            log.error("Web Push: khong khoi tao duoc ({}), tat.", e.getMessage());
        }
        this.enabled = ok;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public String getPublicKey() {
        return publicKey;
    }

    /**
     * Ghi nho mot dang ky nhan thong bao (khi nguoi dung bam "Bat thong bao").
     *
     * Neu endpoint da ton tai (cung trinh duyet bat lai, hoac may dung chung nguoi khac
     * dang nhap) thi xoa ban cu roi tao moi - dam bao endpoint tro dung nguoi hien tai voi
     * khoa moi nhat.
     */
    @Transactional
    public void subscribe(User user, String endpoint, String p256dh, String auth) {
        if (endpoint == null || endpoint.isBlank() || p256dh == null || p256dh.isBlank()
                || auth == null || auth.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid_subscription");
        }
        // Endpoint that cua dich vu push luon la https - chan luu chuoi rac / URL la
        if (endpoint.length() > 1000 || !endpoint.startsWith("https://")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid_subscription");
        }
        repo.findByEndpoint(endpoint).ifPresent(repo::delete);
        repo.flush();
        repo.save(new PushSubscription(user, endpoint, p256dh, auth));
    }

    /**
     * Quen mot dang ky cua CHINH nguoi goi (khi ho tat thong bao tren thiet bi do).
     *
     * Xoa gioi han theo userId: khong cho ai xoa dang ky cua nguoi khac du co biet endpoint.
     */
    @Transactional
    public void unsubscribe(User user, String endpoint) {
        if (user != null && endpoint != null && !endpoint.isBlank()) {
            repo.deleteByEndpointAndUserId(endpoint, user.getId());
        }
    }

    /**
     * Day mot thong bao toi TAT CA thiet bi cua nguoi nay. Chay nen (async) de khong
     * lam cham thao tac goi no (vd: co nguoi vua binh luan xong khong phai ngoi cho).
     *
     * @param url duong dan trong app se mo khi bam vao thong bao (vd "/" hay "/?post=12")
     */
    @Async
    public void sendToUser(User user, String title, String body, String url) {
        if (!enabled || user == null) {
            return;
        }
        List<PushSubscription> subs = repo.findByUserId(user.getId());
        if (subs.isEmpty()) {
            return;
        }

        byte[] payload;
        try {
            payload = mapper.writeValueAsBytes(Map.of(
                    "title", title == null ? "" : title,
                    "body", body == null ? "" : body,
                    "url", url == null || url.isBlank() ? "/" : url));
        } catch (Exception e) {
            return;
        }

        for (PushSubscription sub : subs) {
            try {
                Notification n = new Notification(sub.getEndpoint(), sub.getP256dh(), sub.getAuth(), payload);
                HttpResponse res = pushService.send(n);
                int code = res.getStatusLine().getStatusCode();
                // 404/410 = dang ky da chet (nguoi dung go app / xoa quyen) -> don di
                if (code == 404 || code == 410) {
                    repo.deleteByEndpoint(sub.getEndpoint());
                } else if (code >= 400) {
                    log.warn("Web Push: may chu day tra ma {}.", code);
                }
            } catch (Exception e) {
                log.warn("Web Push: khong gui duoc mot thong bao ({}).", e.getMessage());
            }
        }
    }
}
