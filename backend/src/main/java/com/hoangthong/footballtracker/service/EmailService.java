package com.hoangthong.footballtracker.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * Gui email qua Resend API (https://resend.com).
 * Neu chua cau hinh RESEND_API_KEY thi chi ghi log, khong nem loi.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final String apiKey;
    private final RestClient restClient;

    public EmailService(@Value("${resend.api-key:}") String apiKey) {
        this.apiKey = apiKey;
        this.restClient = RestClient.builder()
                .baseUrl("https://api.resend.com")
                .build();
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    public boolean send(String to, String subject, String body) {
        if (!isConfigured()) {
            log.info("[EMAIL BO QUA - chua cau hinh RESEND_API_KEY] To: {} | {}", to, subject);
            return false;
        }

        try {
            Map<String, Object> payload = Map.of(
                    "from", "Football Stats Tracker <onboarding@resend.dev>",
                    "to", List.of(to),
                    "subject", subject,
                    "text", body
            );

            restClient.post()
                    .uri("/emails")
                    .header("Authorization", "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .toBodilessEntity();

            log.info("Da gui email toi {}: {}", to, subject);
            return true;
        } catch (Exception ex) {
            log.warn("Gui email toi {} that bai: {}", to, ex.getMessage());
            return false;
        }
    }
}