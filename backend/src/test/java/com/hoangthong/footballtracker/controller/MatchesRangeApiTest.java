package com.hoangthong.footballtracker.controller;

import com.hoangthong.footballtracker.config.SecurityConfig;
import com.hoangthong.footballtracker.config.WebCorsConfig;
import com.hoangthong.footballtracker.dto.DayMatchDto;
import com.hoangthong.footballtracker.security.JwtAuthFilter;
import com.hoangthong.footballtracker.security.JwtService;
import com.hoangthong.footballtracker.service.DayMatchesService;
import com.hoangthong.footballtracker.service.MatchesService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Kiem thu endpoint /api/matches/range di qua ca chuoi filter that:
 * xac nhan Spring TU CHUYEN chuoi ISO-8601 tren URL thanh Instant (neu khong,
 * moi request se hong voi loi 400 du service hoan toan dung).
 */
@WebMvcTest(controllers = MatchesController.class)
@Import({SecurityConfig.class, WebCorsConfig.class, JwtAuthFilter.class, JwtService.class})
@TestPropertySource(properties = {
        "app.jwt.secret=test-secret-key-phai-dai-toi-thieu-32-ky-tu!!",
        "app.jwt.expiration-ms=3600000",
        "app.cors.allowed-origin=http://localhost:5173"
})
class MatchesRangeApiTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private MatchesService matchesService;

    @MockBean
    private DayMatchesService dayMatchesService;

    // JwtAuthFilter can UserRepository de kiem tai khoan con hoat dong khong.
    // Cac test o day deu goi endpoint cong khai nen khong can gia lap du lieu gi.
    @MockBean
    private com.hoangthong.footballtracker.repository.UserRepository userRepository;

    @Test
    void chuoi_ISO_tren_URL_duoc_chuyen_dung_thanh_Instant() throws Exception {
        Instant from = Instant.parse("2026-08-02T17:00:00Z");
        Instant to = Instant.parse("2026-08-03T17:00:00Z");
        when(dayMatchesService.getMatchesBetween(eq(from), eq(to))).thenReturn(List.of(
                new DayMatchDto(100, "PL", "2026-08-03T14:00:00Z", "FINISHED", 5,
                        "Arsenal FC", "https://crest/57.png", "Chelsea FC", "https://crest/61.png", 2, 1)));

        mockMvc.perform(get("/api/matches/range")
                        .param("from", "2026-08-02T17:00:00Z")
                        .param("to", "2026-08-03T17:00:00Z"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].competition").value("PL"))
                .andExpect(jsonPath("$[0].homeTeam").value("Arsenal FC"))
                .andExpect(jsonPath("$[0].homeScore").value(2));
    }

    @Test
    void endpoint_la_cong_khai_khong_can_dang_nhap() throws Exception {
        when(dayMatchesService.getMatchesBetween(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any()))
                .thenReturn(List.of());

        mockMvc.perform(get("/api/matches/range")
                        .param("from", "2026-08-02T17:00:00Z")
                        .param("to", "2026-08-03T17:00:00Z"))
                .andExpect(status().isOk());
    }

    @Test
    void thieu_tham_so_thi_tra_400() throws Exception {
        mockMvc.perform(get("/api/matches/range").param("from", "2026-08-02T17:00:00Z"))
                .andExpect(status().isBadRequest());
    }
}
