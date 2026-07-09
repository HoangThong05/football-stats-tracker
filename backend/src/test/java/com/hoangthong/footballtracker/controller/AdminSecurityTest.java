package com.hoangthong.footballtracker.controller;

import com.hoangthong.footballtracker.config.SecurityConfig;
import com.hoangthong.footballtracker.config.WebCorsConfig;
import com.hoangthong.footballtracker.dto.UserSummaryDto;
import com.hoangthong.footballtracker.security.JwtAuthFilter;
import com.hoangthong.footballtracker.security.JwtService;
import com.hoangthong.footballtracker.service.AdminService;
import com.hoangthong.footballtracker.service.StandingsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Kiem thu PHAN QUYEN that su di qua chuoi filter bao mat:
 * token duoc sinh boi JwtService that, gui qua header Authorization nhu frontend lam.
 */
@WebMvcTest(controllers = {AdminController.class, StandingsController.class})
@Import({SecurityConfig.class, WebCorsConfig.class, JwtAuthFilter.class, JwtService.class})
@TestPropertySource(properties = {
        "app.jwt.secret=test-secret-key-phai-dai-toi-thieu-32-ky-tu!!",
        "app.jwt.expiration-ms=3600000",
        "app.cors.allowed-origin=http://localhost:5173"
})
class AdminSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @MockBean
    private AdminService adminService;

    @MockBean
    private StandingsService standingsService;

    @Test
    void chua_dang_nhap_thi_khong_vao_duoc_api_admin() throws Exception {
        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isForbidden());
    }

    @Test
    void user_thuong_goi_api_admin_thi_bi_chan_403() throws Exception {
        String tokenUser = jwtService.generateToken("an@example.com", "USER");

        mockMvc.perform(get("/api/admin/users").header("Authorization", "Bearer " + tokenUser))
                .andExpect(status().isForbidden());
    }

    @Test
    void admin_goi_api_admin_thi_duoc_phep_va_thay_danh_sach() throws Exception {
        when(adminService.listUsers()).thenReturn(List.of(
                new UserSummaryDto(1, "an@example.com", "USER", "2026-07-09T00:00:00Z"),
                new UserSummaryDto(2, "admin@example.com", "ADMIN", "2026-07-09T00:00:00Z")));

        String tokenAdmin = jwtService.generateToken("admin@example.com", "ADMIN");

        mockMvc.perform(get("/api/admin/users").header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[1].role").value("ADMIN"));
    }

    @Test
    void token_hong_thi_bi_coi_nhu_chua_dang_nhap() throws Exception {
        mockMvc.perform(get("/api/admin/users").header("Authorization", "Bearer token-bay-ba"))
                .andExpect(status().isForbidden());
    }

    @Test
    void api_cong_khai_van_goi_duoc_khi_chua_dang_nhap() throws Exception {
        when(standingsService.getStandings("PL")).thenReturn(List.of());

        mockMvc.perform(get("/api/standings/PL"))
                .andExpect(status().isOk());
    }
}
