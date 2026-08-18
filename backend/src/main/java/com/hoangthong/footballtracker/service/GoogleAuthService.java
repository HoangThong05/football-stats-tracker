package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.dto.AuthResponse;
import com.hoangthong.footballtracker.entity.User;
import com.hoangthong.footballtracker.repository.UserRepository;
import com.hoangthong.footballtracker.security.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Dang nhap bang tai khoan Google.
 *
 * LUONG: trinh duyet cho nguoi dung chon tai khoan Google -> Google tra ve mot ID token
 * -> frontend gui token do len day -> ta XAC MINH roi phat JWT cua chinh minh. Tu day
 * tro di moi thu giong het dang nhap thuong, frontend khong phai biet gi khac.
 *
 * PHAI xac minh o BACKEND. ID token chi la mot chuoi ky tu; ai cung co the tu bia ra roi
 * gui len. Khong kiem chu ky thi bat ky ai cung dang nhap duoc bang email cua nguoi khac.
 */
@Service
public class GoogleAuthService {

    private static final Logger log = LoggerFactory.getLogger(GoogleAuthService.class);

    /** Bo khoa cong khai cua Google - NimbusJwtDecoder tu tai ve va tu cache. */
    private static final String GOOGLE_JWKS = "https://www.googleapis.com/oauth2/v3/certs";

    /** Google phat token voi mot trong hai dang nay, ca hai deu hop le. */
    private static final Set<String> VALID_ISSUERS =
            Set.of("https://accounts.google.com", "accounts.google.com");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final String clientId;

    /**
     * Tao mot lan roi dung lai: NimbusJwtDecoder tu cache bo khoa cua Google, tao moi
     * moi lan dang nhap se lam no tai lai khoa mot cach vo ich.
     */
    private final NimbusJwtDecoder decoder;

    public GoogleAuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            @Value("${app.google.client-id:}") String clientId) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.clientId = clientId;
        this.decoder = NimbusJwtDecoder.withJwkSetUri(GOOGLE_JWKS).build();
    }

    /** Chua cau hinh GOOGLE_CLIENT_ID -> tinh nang tat han, frontend an nut di. */
    public boolean isEnabled() {
        return clientId != null && !clientId.isBlank();
    }

    /**
     * Client ID de frontend khoi tao Google Identity Services.
     *
     * Day KHONG phai bi mat - moi trang web dung GIS deu nhung no thang trong HTML.
     * Cai phai giu kin la Client SECRET, va luong nay khong dung toi no.
     *
     * Tra tu backend thay vi de frontend tu cau hinh: chi phai dat o MOT noi, khong so
     * hai ben lech nhau roi ra loi "invalid audience" rat kho lan.
     */
    public String getClientId() {
        return clientId;
    }

    /**
     * @param idToken chuoi credential do Google Identity Services tra ve o frontend
     * @return JWT cua app nay, giong het cai ma /login tra ve
     */
    public AuthResponse loginWithGoogle(String idToken) {
        if (!isEnabled()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "google_login_not_configured");
        }
        if (idToken == null || idToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "missing_token");
        }

        // Buoc nay kiem CHU KY va HAN dung cua token dua tren khoa cong khai cua Google
        Jwt jwt;
        try {
            jwt = decoder.decode(idToken);
        } catch (JwtException ex) {
            log.warn("ID token Google khong hop le: {}", ex.getMessage());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid_google_token");
        }

        verifyIssuer(jwt);
        verifyAudience(jwt);

        String email = jwt.getClaimAsString("email");
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "google_token_missing_email");
        }

        /*
         * email_verified = false nghia la Google CHUA xac nhan nguoi nay so huu hop thu do.
         * Cho qua thi ai do co the tao tai khoan Google voi email cua nguoi khac roi chiem
         * tai khoan tuong ung ben minh.
         */
        if (!Boolean.TRUE.equals(jwt.getClaim("email_verified"))) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "google_email_not_verified");
        }

        User user = userRepository.findByEmail(email).orElseGet(() -> createGoogleUser(email));

        // Khoa tai khoan phai chan CA duong Google, khong thi khoa xong van vao duoc bang nut kia
        if (!user.isEnabled()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "account_disabled");
        }

        String role = user.getRole().name();
        return new AuthResponse(jwtService.generateToken(user.getEmail(), role), user.getEmail(), role);
    }

    private void verifyIssuer(Jwt jwt) {
        String issuer = jwt.getClaimAsString("iss");
        if (!VALID_ISSUERS.contains(issuer)) {
            log.warn("ID token co issuer la {}, khong phai cua Google", issuer);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid_google_token");
        }
    }

    /**
     * aud PHAI dung Client ID cua app nay.
     *
     * Thieu buoc nay thi mot token do Google phat cho MOT APP KHAC van duoc chap nhan -
     * chu ky van dung, han van con, nhung no khong danh cho minh. Ke tan cong chi can
     * dung mot app bat ky cua ho de lay token roi dang nhap vao day.
     */
    private void verifyAudience(Jwt jwt) {
        List<String> audience = jwt.getAudience();
        if (audience == null || !audience.contains(clientId)) {
            log.warn("ID token co audience {} - khong khop Client ID cua app", audience);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid_google_token");
        }
    }

    /**
     * Nguoi dung Google khong co mat khau, nhung cot passwordHash lai NOT NULL.
     *
     * Dat mot chuoi ngau nhien da bam thay vi doi cot sang cho phep null: Hibernate chay
     * o che do "update" khong go bo rang buoc NOT NULL da co san tren DB that, nen doi
     * kieu cot se bien thanh loi luc chay chu khong phai luc khoi dong.
     *
     * Chuoi nay khong ai doan duoc nen dang nhap bang mat khau se khong bao gio khop.
     * Muon dat mat khau that thi dung chuc nang "Quen mat khau" nhu binh thuong.
     */
    private User createGoogleUser(String email) {
        log.info("Tao tai khoan moi tu dang nhap Google: {}", email);
        User user = new User(email, passwordEncoder.encode(UUID.randomUUID().toString()));
        return userRepository.save(user);
    }
}
