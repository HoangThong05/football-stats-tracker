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

    public AuthResponse register(AuthRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "email_exists");
        }
        User user = new User(request.email(), passwordEncoder.encode(request.password()));
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
        User user = userRepository.findByResetToken(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "token_invalid"));
        if (user.getResetTokenExpiry() == null || Instant.now().isAfter(user.getResetTokenExpiry())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "token_expired");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
    }

    private AuthResponse toAuthResponse(User user) {
        String role = user.getRole().name();
        String token = jwtService.generateToken(user.getEmail(), role);
        return new AuthResponse(token, user.getEmail(), role);
    }
}