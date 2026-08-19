package com.hoangthong.footballtracker.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

/**
 * Sinh va xac thuc JWT. Token chua email cua user o claim "sub".
 * Secret phai dai toi thieu 32 ky tu (HS256 can khoa >= 256 bit).
 */
@Component
public class JwtService {

    private final SecretKey key;
    private final long expirationMs;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms}") long expirationMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    /** Ten claim chua doi token. Doc bang {@link #tokenVersionOf(Claims)}. */
    private static final String CLAIM_TOKEN_VERSION = "tv";

    /** Phien nay dang nhap bang nut Google hay bang mat khau. */
    private static final String CLAIM_VIA_GOOGLE = "g";

    public String generateToken(String email, String role, int tokenVersion) {
        return generateToken(email, role, tokenVersion, false);
    }

    public String generateToken(String email, String role, int tokenVersion, boolean viaGoogle) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(email)
                .claim("role", role)
                .claim(CLAIM_TOKEN_VERSION, tokenVersion)
                .claim(CLAIM_VIA_GOOGLE, viaGoogle)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(expirationMs)))
                .signWith(key)
                .compact();
    }

    /**
     * Tra ve toan bo claims (email o subject, role o claim "role") neu token hop le;
     * nem ngoai le neu het han/sai chu ky.
     */
    /**
     * Doi token ghi trong claim.
     *
     * Token phat truoc khi co tinh nang nay khong co claim "tv" -> tra 0, khop voi
     * tokenVersion mac dinh cua user, nen khong ai bi da ra ngoai luc trien khai.
     */
    public static int tokenVersionOf(Claims claims) {
        Integer version = claims.get(CLAIM_TOKEN_VERSION, Integer.class);
        return version == null ? 0 : version;
    }

    /** null (token doi cu) = khong phai phien Google. */
    public static boolean viaGoogle(Claims claims) {
        return Boolean.TRUE.equals(claims.get(CLAIM_VIA_GOOGLE, Boolean.class));
    }

    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
