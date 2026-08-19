package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.entity.User;
import com.hoangthong.footballtracker.repository.UserRepository;
import com.hoangthong.footballtracker.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ChangePasswordTest {

    private UserRepository userRepository;
    private AuthService authService;
    private final PasswordEncoder encoder = new BCryptPasswordEncoder();

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        JwtService jwtService = mock(JwtService.class);
        when(jwtService.generateToken(anyString(), anyString(), anyInt())).thenReturn("token-moi");
        authService = new AuthService(userRepository, encoder, jwtService, null);
    }

    private User nguoiDungCoMatKhau(String matKhau) {
        User user = new User("an@example.com", encoder.encode(matKhau));
        when(userRepository.findByEmail("an@example.com")).thenReturn(Optional.of(user));
        return user;
    }

    @Test
    void doi_thanh_cong_thi_mat_khau_moi_dung_va_mat_khau_cu_het_tac_dung() {
        User user = nguoiDungCoMatKhau("cu-123456");

        authService.changePassword("an@example.com", "cu-123456", "moi-654321", false);

        assertThat(encoder.matches("moi-654321", user.getPasswordHash())).isTrue();
        assertThat(encoder.matches("cu-123456", user.getPasswordHash())).isFalse();
    }

    @Test
    void doi_mat_khau_lam_moi_token_cu_het_gia_tri() {
        User user = nguoiDungCoMatKhau("cu-123456");
        int truoc = user.getTokenVersion();

        authService.changePassword("an@example.com", "cu-123456", "moi-654321", false);

        // Doi token phai tang, neu khong thi ke dang cam token cu van dung tiep binh thuong
        assertThat(user.getTokenVersion()).isGreaterThan(truoc);
    }

    @Test
    void sai_mat_khau_hien_tai_thi_khong_doi_duoc() {
        User user = nguoiDungCoMatKhau("cu-123456");

        assertThatThrownBy(() -> authService.changePassword("an@example.com", "doan-bua", "moi-654321", false))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("wrong_current_password");

        assertThat(encoder.matches("cu-123456", user.getPasswordHash())).isTrue();
        assertThat(user.getTokenVersion()).isZero();
    }

    @Test
    void mat_khau_moi_qua_ngan_thi_bi_tu_choi() {
        nguoiDungCoMatKhau("cu-123456");

        assertThatThrownBy(() -> authService.changePassword("an@example.com", "cu-123456", "12345", false))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("password_too_short");
    }

    @Test
    void tai_khoan_Google_dat_duoc_mat_khau_ma_khong_can_mat_khau_hien_tai() {
        // Chu tai khoan khong he biet chuoi ngau nhien sinh luc tao -> hoi cung vo ich
        User user = nguoiDungCoMatKhau("chuoi-ngau-nhien-khong-ai-biet");
        user.setHasPassword(false);

        authService.changePassword("an@example.com", null, "moi-654321", false);

        assertThat(encoder.matches("moi-654321", user.getPasswordHash())).isTrue();
        assertThat(user.hasPassword()).isTrue();
    }

    /**
     * Truong hop chinh khien phai sua: tai khoan dang ky bang email + mat khau tu lau,
     * sau nay dang nhap bang nut Google. Xet theo KIEU TAI KHOAN thi no "co mat khau"
     * nen bi hoi mat khau hien tai - trong khi nguoi dung khong he go mat khau nao
     * trong phien do va co the khong con nho no.
     */
    @Test
    void dang_nhap_bang_Google_thi_khong_bi_hoi_mat_khau_cu_du_tai_khoan_co_mat_khau() {
        User user = nguoiDungCoMatKhau("mat-khau-tu-doi-nao");
        assertThat(user.hasPassword()).isTrue();

        authService.changePassword("an@example.com", null, "moi-654321", true);

        assertThat(encoder.matches("moi-654321", user.getPasswordHash())).isTrue();
    }

    /** Dang nhap bang mat khau thi van phai go dung mat khau cu - khong duoc noi long. */
    @Test
    void phien_thuong_van_bat_buoc_go_dung_mat_khau_cu() {
        nguoiDungCoMatKhau("mat-khau-that");

        assertThatThrownBy(() -> authService.changePassword("an@example.com", null, "moi-654321", false))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("wrong_current_password");
    }

    @Test
    void doi_mat_khau_huy_luon_link_dat_lai_dang_treo() {
        User user = nguoiDungCoMatKhau("cu-123456");
        user.setResetToken("link-cu-con-hieu-luc");

        authService.changePassword("an@example.com", "cu-123456", "moi-654321", false);

        assertThat(user.getResetToken()).isNull();
    }
}
