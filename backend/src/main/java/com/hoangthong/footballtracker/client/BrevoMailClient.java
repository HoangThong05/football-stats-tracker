package com.hoangthong.footballtracker.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * Gui email qua HTTP API cua Brevo thay vi SMTP.
 *
 * LY DO TON TAI: Render (goi free) chan ket noi ra o cong SMTP 587, log bao
 * "Couldn't connect to host, port: smtp.gmail.com, 587". Khong phai loi mat khau
 * - la ket noi TCP khong mo duoc, nen chinh App Password bao nhieu lan cung vo ich.
 * API nay di cong 443 nhu moi request HTTPS khac, khong bi chan.
 */
@Component
public class BrevoMailClient {

    private static final Logger log = LoggerFactory.getLogger(BrevoMailClient.class);
    private static final String BASE_URL = "https://api.brevo.com/v3";
    private static final String SENDER_NAME = "Football Stats Tracker";

    private final RestClient restClient;
    private final String apiKey;

    public BrevoMailClient(@Value("${app.mail.brevo.api-key:}") String apiKey) {
        this.apiKey = apiKey;
        this.restClient = RestClient.builder().baseUrl(BASE_URL).build();
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    /**
     * @param from phai la dia chi da xac minh trong Brevo, khong thi bi tu choi 400.
     */
    public boolean send(String from, String to, String subject, String body) {
        try {
            restClient.post()
                    .uri("/smtp/email")
                    .header("api-key", apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "sender", Map.of("email", from, "name", SENDER_NAME),
                            "to", List.of(Map.of("email", to)),
                            "subject", subject,
                            "textContent", body))
                    .retrieve()
                    .toBodilessEntity();
            log.info("Brevo: da gui email toi {}: {}", to, subject);
            return true;
        } catch (Exception ex) {
            log.warn("Brevo: gui email toi {} that bai: {}", to, ex.getMessage());
            return false;
        }
    }
}
