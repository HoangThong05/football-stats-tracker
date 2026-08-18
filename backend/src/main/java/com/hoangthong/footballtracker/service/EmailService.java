package com.hoangthong.footballtracker.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Gui email qua Gmail SMTP (JavaMail).
 * Neu chua cau hinh MAIL_USERNAME thi chi ghi log, khong nem loi.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final String from;

    public EmailService(JavaMailSender mailSender,
                        @Value("${spring.mail.username:}") String from) {
        this.mailSender = mailSender;
        this.from = from;
    }

    public boolean isConfigured() {
        return from != null && !from.isBlank();
    }

    /**
     * Gui o luong nen, tra ve ngay lap tuc.
     *
     * Dung cho quen mat khau: nguoi dung khong can - va khong nen - phai cho SMTP xong.
     * Cho o day thi thoi gian phan hoi lo luon email nao co that (gui that thi lau,
     * khong co thi tra ve tuc thi), dung cai ma man hinh kia co tinh giau di.
     */
    @Async
    public void sendAsync(String to, String subject, String body) {
        send(to, subject, body);
    }

    public boolean send(String to, String subject, String body) {
        if (!isConfigured()) {
            log.info("[EMAIL BO QUA - chua cau hinh SMTP] To: {} | {}", to, subject);
            return false;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(from);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Da gui email toi {}: {}", to, subject);
            return true;
        } catch (Exception ex) {
            log.warn("Gui email toi {} that bai: {}", to, ex.getMessage());
            return false;
        }
    }
}