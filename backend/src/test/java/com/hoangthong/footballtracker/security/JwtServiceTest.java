package com.hoangthong.footballtracker.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.security.SignatureException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    // HS384 can khoa du dai; chuoi 48 ky tu la an toan.
    private static final String SECRET = "test-secret-key-phai-dai-toi-thieu-32-ky-tu!!";
    private static final long ONE_HOUR = 3_600_000L;

    private final JwtService jwtService = new JwtService(SECRET, ONE_HOUR);

    @Test
    void token_chua_email_o_subject_va_role_o_claim() {
        String token = jwtService.generateToken("an@example.com", "ADMIN");

        Claims claims = jwtService.parseClaims(token);

        assertThat(claims.getSubject()).isEqualTo("an@example.com");
        assertThat(claims.get("role", String.class)).isEqualTo("ADMIN");
    }

    @Test
    void role_USER_cung_duoc_nhung_vao_token() {
        String token = jwtService.generateToken("binh@example.com", "USER");

        assertThat(jwtService.parseClaims(token).get("role", String.class)).isEqualTo("USER");
    }

    @Test
    void token_het_han_thi_nem_ngoai_le() {
        // expirationMs am => token sinh ra da het han ngay lap tuc
        JwtService expiredService = new JwtService(SECRET, -1000L);
        String token = expiredService.generateToken("an@example.com", "USER");

        assertThatThrownBy(() -> expiredService.parseClaims(token))
                .isInstanceOf(ExpiredJwtException.class);
    }

    @Test
    void token_ky_bang_secret_khac_thi_bi_tu_choi() {
        String token = jwtService.generateToken("an@example.com", "USER");
        JwtService kePhaHoai = new JwtService("secret-khac-hoan-toan-cung-dai-32-ky-tu!!!!", ONE_HOUR);

        assertThatThrownBy(() -> kePhaHoai.parseClaims(token))
                .isInstanceOf(SignatureException.class);
    }

    @Test
    void token_bi_sua_doi_thi_bi_tu_choi() {
        String token = jwtService.generateToken("an@example.com", "USER");
        String tokenGia = token.substring(0, token.length() - 2) + "xx";

        assertThatThrownBy(() -> jwtService.parseClaims(tokenGia))
                .isInstanceOf(Exception.class);
    }
}
