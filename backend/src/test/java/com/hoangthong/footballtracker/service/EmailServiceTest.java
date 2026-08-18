package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.client.BrevoMailClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Chot lai duong gui email.
 *
 * Da ba lan phai sua quanh cho nay (thieu timeout, chan luong request, cong 587 bi
 * chan tren Render). Test de neu ai do lo tra SMTP ve lam duong chinh thi vo ngay
 * o day chu khong doi den luc nguoi dung khong nhan duoc thu moi biet.
 */
class EmailServiceTest {

    private JavaMailSender mailSender;
    private BrevoMailClient brevo;

    @BeforeEach
    void setUp() {
        mailSender = mock(JavaMailSender.class);
        brevo = mock(BrevoMailClient.class);
    }

    @Test
    void co_brevo_thi_gui_qua_http_va_khong_dung_smtp() {
        when(brevo.isConfigured()).thenReturn(true);
        when(brevo.send(eq("app@gmail.com"), eq("ai@example.com"), any(), any())).thenReturn(true);

        EmailService service = new EmailService(mailSender, brevo, "app@gmail.com");
        boolean sent = service.send("ai@example.com", "Tieu de", "Noi dung");

        assertThat(sent).isTrue();
        verify(brevo).send("app@gmail.com", "ai@example.com", "Tieu de", "Noi dung");
        verify(mailSender, never()).send(any(SimpleMailMessage.class));
    }

    @Test
    void khong_co_brevo_thi_quay_ve_smtp() {
        when(brevo.isConfigured()).thenReturn(false);

        EmailService service = new EmailService(mailSender, brevo, "app@gmail.com");
        boolean sent = service.send("ai@example.com", "Tieu de", "Noi dung");

        assertThat(sent).isTrue();
        verify(mailSender).send(any(SimpleMailMessage.class));
    }

    @Test
    void chua_cau_hinh_dia_chi_gui_thi_bo_qua_chu_khong_nem_loi() {
        EmailService service = new EmailService(mailSender, brevo, "");
        boolean sent = service.send("ai@example.com", "Tieu de", "Noi dung");

        assertThat(sent).isFalse();
        verify(brevo, never()).send(any(), any(), any(), any());
        verify(mailSender, never()).send(any(SimpleMailMessage.class));
    }
}
