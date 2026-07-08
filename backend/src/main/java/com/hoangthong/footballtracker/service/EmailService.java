package com.hoangthong.footballtracker.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Gui email don gian qua SMTP.
 * Neu chua cau hinh tai khoan mail (bien MAIL_USERNAME rong) thi CHI ghi log,
 * khong nem loi -> app van chay binh thuong khi dang phat trien.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final String from;

    public EmailService(JavaMailSender mailSender, @Value("${spring.mail.username:}") String from) {
        this.mailSender = mailSender;
        this.from = from;
    }

    public boolean isConfigured() {
        return from != null && !from.isBlank();
    }

    /**
     * @return true neu da gui thanh cong; false neu chua cau hinh mail hoac gui loi.
     */
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
