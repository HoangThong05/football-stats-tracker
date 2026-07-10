package com.hoangthong.footballtracker.config;

import com.hoangthong.footballtracker.security.JwtAuthFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

/**
 * API stateless dung JWT: khong session, khong CSRF (khong dung cookie de xac thuc).
 * Cac endpoint doc du lieu bong da la cong khai; /api/favorites yeu cau da dang nhap.
 */
@Configuration
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final CorsConfigurationSource corsConfigurationSource;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter, CorsConfigurationSource corsConfigurationSource) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.corsConfigurationSource = corsConfigurationSource;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // "/error": noi Spring forward request toi khi mot controller nem
                        // ResponseStatusException (vd sai mat khau -> 401). Neu khong permitAll o day,
                        // request forward se bi chinh Security chan lai (chua dang nhap) -> tra ve
                        // 403 rong thay vi ma loi that su (401 kem thong bao).
                        .requestMatchers("/error").permitAll()
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/standings/**", "/api/matches/**", "/api/teams/**", "/api/scorers/**").permitAll()
                        // Xem lich du doan + BXH du doan la cong khai; GUI du doan (POST /api/predictions)
                        // va xem lich su ca nhan (/api/predictions/mine) van roi vao anyRequest().authenticated().
                        .requestMatchers("/api/predictions/matches/**", "/api/predictions/leaderboard").permitAll()
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
