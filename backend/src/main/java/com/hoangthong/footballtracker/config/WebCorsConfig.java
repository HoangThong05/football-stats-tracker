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
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        // Cho phep frontend doc header tuy chinh nay qua fetch (mac dinh trinh duyet chi
        // cho JS doc mot so header "don gian", header tu dat phai khai bao rieng o day).
        /*
         * Header tu dat PHAI khai bao o day. Khong co trong danh sach nay thi trinh duyet
         * VAN nhan duoc header nhung CHAN JavaScript doc - res.headers.get() tra ve null
         * ma khong bao loi gi, rat kho lan ra.
         */
        config.setExposedHeaders(List.of("X-Season-Label", "X-Season-Start"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }
}
