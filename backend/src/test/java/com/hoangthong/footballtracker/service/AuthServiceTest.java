package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.dto.AuthRequest;
import com.hoangthong.footballtracker.dto.AuthResponse;
import com.hoangthong.footballtracker.entity.Role;
import com.hoangthong.footballtracker.entity.User;
import com.hoangthong.footballtracker.repository.UserRepository;
import com.hoangthong.footballtracker.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;


import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthServiceTest {

    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private JwtService jwtService;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        jwtService = mock(JwtService.class);
        authService = new AuthService(userRepository, passwordEncoder, jwtService, null);
    }

    /**
     * Kiem tra dinh dang PHAI o backend.
     *
     * <input type="email"> cua trinh duyet cho qua ten mien khong co dau cham
     * ("a@gmail-cn") - dung chuan HTML nhung khong phai dia chi that. Va ai goi thang
     * API thi khong co o input nao chan ho.
     */
    @Test
    void email_sai_dinh_dang_thi_khong_dang_ky_duoc() {
        for (String xau : new String[]{"khong-co-cho-a", "a@gmail-cn", "a@b", "@gmail.com",
                                       "a b@gmail.com", "", "   "}) {
            assertThatThrownBy(() -> authService.register(new AuthRequest(xau, "123456")))
                    .as("email: '%s'", xau)
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("invalid_email");
        }
        verify(userRepository, never()).save(any());
    }

    @Test
    void email_dung_dinh_dang_thi_qua() {
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");

        for (String tot : new String[]{"a@gmail.com", "ten.co.dau@sub.domain.vn", "a+b@x.co.uk"}) {
            authService.register(new AuthRequest(tot, "123456"));
        }
        verify(userRepository, org.mockito.Mockito.times(3)).save(any());
    }

    @Test
    void mat_khau_qua_ngan_thi_khong_dang_ky_duoc() {
        assertThatThrownBy(() -> authService.register(new AuthRequest("a@gmail.com", "12345")))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("password_too_short");
        verify(userRepository, never()).save(any());
    }

    /** Khoang trang thua o dau/cuoi khong duoc bien thanh mot tai khoan khac. */
    @Test
    void email_duoc_cat_khoang_trang_thua() {
        when(userRepository.existsByEmail("a@gmail.com")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");

        authService.register(new AuthRequest("  a@gmail.com  ", "123456"));

        verify(userRepository).existsByEmail("a@gmail.com");
    }

    @Test
    void dang_ky_thanh_cong_thi_tra_ve_role_USER() {
        when(userRepository.existsByEmail("moi@example.com")).thenReturn(false);
        when(passwordEncoder.encode("123456")).thenReturn("hashed");
        when(jwtService.generateToken("moi@example.com", "USER", 0)).thenReturn("token-abc");

        AuthResponse response = authService.register(new AuthRequest("moi@example.com", "123456"));

        assertThat(response.email()).isEqualTo("moi@example.com");
        assertThat(response.role()).isEqualTo("USER");
        assertThat(response.token()).isEqualTo("token-abc");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void dang_ky_trung_email_thi_tra_409_va_khong_luu() {
        when(userRepository.existsByEmail("da_ton_tai@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(new AuthRequest("da_ton_tai@example.com", "123456")))
                .isInstanceOf(ResponseStatusException.class)
                .hasFieldOrPropertyWithValue("statusCode", HttpStatus.CONFLICT);

        verify(userRepository, never()).save(any());
    }

    @Test
    void dang_nhap_dung_thi_tra_dung_role_cua_user() {
        User admin = new User("admin@example.com", "hashed");
        admin.setRole(Role.ADMIN);

        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(admin));
        when(passwordEncoder.matches("123456", "hashed")).thenReturn(true);
        when(jwtService.generateToken("admin@example.com", "ADMIN", 0)).thenReturn("token-admin");

        AuthResponse response = authService.login(new AuthRequest("admin@example.com", "123456"));

        // Day chinh la truong ma frontend dung de hien nut "Quan tri"
        assertThat(response.role()).isEqualTo("ADMIN");
        assertThat(response.token()).isEqualTo("token-admin");
    }

    @Test
    void dang_nhap_sai_mat_khau_thi_tra_401() {
        User user = new User("an@example.com", "hashed");
        when(userRepository.findByEmail("an@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);

        assertThatThrownBy(() -> authService.login(new AuthRequest("an@example.com", "sai-mat-khau")))
                .isInstanceOf(ResponseStatusException.class)
                .hasFieldOrPropertyWithValue("statusCode", HttpStatus.UNAUTHORIZED);
    }

    @Test
    void dang_nhap_email_khong_ton_tai_thi_tra_401() {
        when(userRepository.findByEmail("khong_co@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(new AuthRequest("khong_co@example.com", "123456")))
                .isInstanceOf(ResponseStatusException.class)
                .hasFieldOrPropertyWithValue("statusCode", HttpStatus.UNAUTHORIZED);
    }
}
