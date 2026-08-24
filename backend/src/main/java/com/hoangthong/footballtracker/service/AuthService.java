package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.dto.AuthRequest;
import com.hoangthong.footballtracker.dto.AuthResponse;
import com.hoangthong.footballtracker.entity.User;
import com.hoangthong.footballtracker.repository.UserRepository;
import com.hoangthong.footballtracker.security.JwtService;
import com.hoangthong.footballtracker.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.UUID;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       JwtService jwtService, EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.emailService = emailService;
    }

    /**
     * Dinh dang email toi thieu: co phan truoc @, co ten mien, VA ten mien phai co dau cham.
     *
     * Vi sao phai tu kiem: o <input type="email"> cua trinh duyet CHAP NHAN ten mien
     * khong co dau cham (vd "a@gmail-cn") - dung theo chuan HTML vi dia chi noi bo la
     * hop le - nen khong the tin no. Va quan trong hon: ai goi thang API thi khong co
     * o input nao chan ho ca.
     */
    private static final java.util.regex.Pattern EMAIL_PATTERN =
            java.util.regex.Pattern.compile("^[^\\s@]+@[^\\s@.]+(\\.[^\\s@.]+)+$");

    private static final int MIN_PASSWORD_LENGTH = 6;
    private static final int MAX_EMAIL_LENGTH = 254;

    public AuthResponse register(AuthRequest request) {
        String email = request.email() == null ? "" : request.email().trim();
        if (email.length() > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.matcher(email).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid_email");
        }
        if (request.password() == null || request.password().length() < MIN_PASSWORD_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "password_too_short");
        }
        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "email_exists");
        }
        User user = new User(email, passwordEncoder.encode(request.password()));
        userRepository.save(user);
        return toAuthResponse(user);
    }

    public AuthResponse login(AuthRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid_credentials"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid_credentials");
        }
        /*
         * Bao ro la bi khoa, khong gop chung vao "sai thong tin dang nhap".
         * Nguoi dung go dung mat khau ma cu bi bao sai thi se ngoi thu lai mai va
         * cuoi cung di dat lai mat khau - trong khi van de khong nam o mat khau.
         */
        if (!user.isEnabled()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "account_disabled");
        }
        return toAuthResponse(user);
    }

    /**
     * Gui link dat lai mat khau.
     *
     * KHONG bao khi email chua dang ky - cu im lang ket thuc nhu binh thuong.
     * Bao ra thi bat ky ai cung do duoc email nao da co tai khoan, chi bang cach go
     * thu tung dia chi vao o "Quen mat khau" va xem cai nao bao loi.
     */
    public void forgotPassword(String email, String appUrl) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            log.info("Yeu cau dat lai mat khau cho email chua dang ky: {}", email);
            return;
        }

        String token = UUID.randomUUID().toString();
        user.setResetToken(token);
        user.setResetTokenExpiry(Instant.now().plusSeconds(3600));
        userRepository.save(user);
        String resetLink = appUrl + "/reset-password?token=" + token;
        emailService.sendAsync(
                email,
                "Đặt lại mật khẩu - Football Stats Tracker",
                "Bấm vào liên kết sau để đặt lại mật khẩu (hết hạn sau 1 giờ):\n\n" + resetLink +
                "\n\nNếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này."
        );
    }

    public void resetPassword(String token, String newPassword) {
        // Cung mot muc toi thieu voi luc dang ky - khong the di duong vong qua link email
        if (newPassword == null || newPassword.length() < MIN_PASSWORD_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "password_too_short");
        }
        User user = userRepository.findByResetToken(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "token_invalid"));
        if (user.getResetTokenExpiry() == null || Instant.now().isAfter(user.getResetTokenExpiry())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "token_expired");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setHasPassword(true);
        // Nguoi dat lai mat khau thuong la vi nghi bi lo -> da moi phien cu ra ngoai
        user.bumpTokenVersion();
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
    }

    /**
     * Doi mat khau khi dang dang nhap. Tra ve token MOI vi token cu vua bi vo hieu.
     *
     * Tai khoan Google chua tung tu dat mat khau thi khong doi "mat khau hien tai":
     * ho khong he biet chuoi ngau nhien sinh luc tao tai khoan, hoi cung vo ich.
     * Dang o trong phien dang nhap da du chung minh danh tinh.
     */
    public AuthResponse changePassword(String email, String currentPassword, String newPassword,
                                      boolean sessionViaGoogle) {
        if (newPassword == null || newPassword.length() < MIN_PASSWORD_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "password_too_short");
        }
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid_credentials"));

        /*
         * Bo qua buoc hoi mat khau cu neu phien nay dang nhap bang Google: nguoi dung
         * vua chung minh minh lam chu hop thu do voi Google, ma chu hop thu thi dang nao
         * cung dat lai duoc mat khau qua email. Hoi them chi lam kho chu khong chan duoc ai.
         */
        boolean phaiHoiMatKhauCu = user.hasPassword() && !sessionViaGoogle;
        if (phaiHoiMatKhauCu
                && (currentPassword == null || !passwordEncoder.matches(currentPassword, user.getPasswordHash()))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "wrong_current_password");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setHasPassword(true);
        // Da moi thiet bi khac ra ngoai. Ke ma phai doi mat khau vi nghi bi lo thi
        // de token cu song tiep chinh la de nguyen cai lo do.
        user.bumpTokenVersion();
        /*
         * Huy luon link dat lai mat khau dang treo (neu co). Vua tu doi duoc mat khau
         * nghia la khong can den no nua, ma de do thi ai cam duoc link cu van vao duoc.
         */
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);

        return toAuthResponse(user);
    }

    /**
     * Doi ten hien thi. Ten nay la thu NGUOI KHAC nhin thay o bang xep hang va phong dau.
     *
     * Cam ky tu @ de khong ai dat ten trong nhu mot dia chi email cua nguoi khac.
     */
    public AuthResponse setDisplayName(String email, String rawName) {
        String name = rawName == null ? "" : rawName.trim();
        if (name.length() < 2 || name.length() > 30) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "display_name_length");
        }
        if (name.indexOf('@') >= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "display_name_invalid");
        }
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid_credentials"));
        user.setDisplayName(name);
        userRepository.save(user);
        return toAuthResponse(user);
    }

    /**
     * Dat hoac go anh dai dien. Chuoi rong / null = go anh, quay ve vong tron chu cai.
     *
     * Anh da nam san tren Cloudinary roi (trinh duyet tu tai len), o day chi luu lai
     * duong dan - va chi nhan duong dan Cloudinary, xem {@link ImageUrl}.
     */
    public AuthResponse setAvatar(String email, String rawUrl) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid_credentials"));
        user.setAvatarUrl(ImageUrl.clean(rawUrl));
        userRepository.save(user);
        return toAuthResponse(user);
    }

    /** Anh bia hien tai: { coverUrl, coverPos }. coverUrl null = chua dat. */
    public java.util.Map<String, Object> getCover(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid_credentials"));
        return coverMap(user);
    }

    /**
     * Dat / go anh bia + vi tri doc. url rong = go. Chi nhan duong dan Cloudinary
     * (xem {@link ImageUrl}). Tra ve { coverUrl, coverPos } sau khi luu.
     */
    public java.util.Map<String, Object> setCover(String email, String rawUrl, Integer pos) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid_credentials"));
        user.setCoverUrl(ImageUrl.clean(rawUrl));
        // Go anh thi vi tri quay ve mac dinh; con lai lay pos gui len (mac dinh 50)
        user.setCoverPos(user.getCoverUrl() == null ? null : (pos == null ? 50 : pos));
        userRepository.save(user);
        return coverMap(user);
    }

    private java.util.Map<String, Object> coverMap(User user) {
        java.util.Map<String, Object> m = new java.util.HashMap<>();
        m.put("coverUrl", user.getCoverUrl());
        m.put("coverPos", user.getCoverPos());
        return m;
    }

    private AuthResponse toAuthResponse(User user) {
        String role = user.getRole().name();
        String token = jwtService.generateToken(user.getEmail(), role, user.getTokenVersion());
        // id null khi doi tuong chua duoc luu (chi xay ra trong test) -> tra 0 thay vi vo loi
        return new AuthResponse(user.getId() == null ? 0 : user.getId(), token, user.getEmail(), role, user.hasPassword(), false,
                user.displayNameOrFallback(), user.getAvatarUrl());
    }
}