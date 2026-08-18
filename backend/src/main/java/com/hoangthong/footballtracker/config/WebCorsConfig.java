package com.hoangthong.footballtracker.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Cho phep frontend React (chay o cong khac) goi API cua backend.
 * Duoc SecurityConfig su dung truc tiep (khong qua WebMvcConfigurer nua,
 * de tranh cau hinh CORS bi trung/xung dot voi Spring Security).
 */
@Configuration
public class WebCorsConfig {

    @Value("${app.cors.allowed-origin}")
    private String allowedOrigin;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of(allowedOrigin, "https://*.vercel.app"));
        /*
         * PHAI liet ke du moi phuong thuc dang dung. Thieu mot cai thi trinh duyet chan
         * ngay o buoc preflight - request khong bao gio toi duoc backend, va thong bao
         * loi chi noi ve CORS chu khong he chi ra phuong thuc nao bi thieu.
         * PATCH tung bi bo sot, lam vo hai nut doi vai tro va khoa tai khoan.
         */
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        /*
         * Mac dinh trinh duyet chi cho JS doc mot so header "don gian"; header tu dat
         * PHAI khai bao o day. Thieu thi trinh duyet VAN nhan duoc header nhung CHAN
         * JavaScript doc - res.headers.get() tra ve null ma khong bao loi gi.
         */
        config.setExposedHeaders(ApiHeaders.EXPOSED);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }
}
