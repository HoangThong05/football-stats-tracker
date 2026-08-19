package com.hoangthong.footballtracker.controller;

import com.hoangthong.footballtracker.repository.UserRepository;
import com.hoangthong.footballtracker.security.JwtService;
import com.hoangthong.footballtracker.service.AuthService;
import com.hoangthong.footballtracker.service.GoogleAuthService;
import com.hoangthong.footballtracker.service.RateLimiterService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Chan goi don dap vao /auth/forgot-password.
 *
 * Endpoint nay gui email that qua Brevo, han muc 300 thu/ngay. Khong chan thi mot
 * vong lap curl vua doi bom hop thu nan nhan vua dot sach han muc, khien KHONG AI
 * dat lai duoc mat khau cho den hom sau.
 */
@WebMvcTest(controllers = AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(RateLimiterService.class)
@TestPropertySource(properties = "app.cors.allowed-origin=http://localhost:5173")
class AuthRateLimitTest {

    private static final String IP = "203.0.113.9";

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    @MockBean
    private GoogleAuthService googleAuthService;

    /*
     * addFilters=false chi bo qua viec CHAY filter, Spring van dung bean JwtAuthFilter
     * -> van phai co du thu no can trong ngu canh test.
     */
    @MockBean
    private JwtService jwtService;

    @MockBean
    private UserRepository userRepository;

    private void forgot(String email, String ip, int expectedStatus) throws Exception {
        mockMvc.perform(post("/api/auth/forgot-password")
                        .header("X-Forwarded-For", ip)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\"}"))
                .andExpect(status().is(expectedStatus));
    }

    @Test
    void qua_3_lan_mot_email_trong_1_gio_thi_bi_chan() throws Exception {
        forgot("nan-nhan@example.com", IP, 204);
        forgot("nan-nhan@example.com", IP, 204);
        forgot("nan-nhan@example.com", IP, 204);

        forgot("nan-nhan@example.com", IP, 429);

        // Quan trong nhat: lan bi chan KHONG duoc gui them email nao
        verify(authService, times(3)).forgotPassword(anyString(), any());
    }

    @Test
    void doi_email_khac_nhau_van_bi_chan_theo_IP() throws Exception {
        // Moi email chi dinh 1 lan nen gioi han theo email (3) khong bao gio cham toi.
        // Neu chi dem theo email thi day la duong vong de dot han muc Brevo.
        for (int i = 0; i < 10; i++) {
            forgot("nguoi" + i + "@example.com", "198.51.100.7", 204);
        }

        forgot("nguoi-thu-11@example.com", "198.51.100.7", 429);
    }

    @Test
    void may_khac_khong_bi_va_lay() throws Exception {
        forgot("a@example.com", "203.0.113.1", 204);
        forgot("a@example.com", "203.0.113.1", 204);
        forgot("a@example.com", "203.0.113.1", 204);
        forgot("a@example.com", "203.0.113.1", 429);

        // Nguoi dung that o may khac, email khac -> phai van dung duoc binh thuong
        forgot("b@example.com", "203.0.113.2", 204);
    }

    @Test
    void bo_dem_IP_lay_phan_tu_CUOI_cua_X_Forwarded_For() throws Exception {
        // Client tu bia header nay duoc; proxy noi IP that ma no nhin thay vao CUOI.
        // Doc phan dau thi ke tan cong chi can doi chuoi bia la co bo dem moi.
        forgot("x@example.com", "1.1.1.1, 203.0.113.50", 204);
        forgot("y@example.com", "2.2.2.2, 203.0.113.50", 204);
        forgot("z@example.com", "3.3.3.3, 203.0.113.50", 204);
        forgot("w@example.com", "4.4.4.4, 203.0.113.50", 204);
        forgot("v@example.com", "5.5.5.5, 203.0.113.50", 204);
        forgot("u@example.com", "6.6.6.6, 203.0.113.50", 204);
        forgot("t@example.com", "7.7.7.7, 203.0.113.50", 204);
        forgot("s@example.com", "8.8.8.8, 203.0.113.50", 204);
        forgot("r@example.com", "9.9.9.9, 203.0.113.50", 204);
        forgot("q@example.com", "10.10.10.10, 203.0.113.50", 204);

        // Dau chuoi khac nhau het, nhung cuoi chuoi van la mot may -> phai bi chan
        forgot("p@example.com", "11.11.11.11, 203.0.113.50", 429);
    }
}
