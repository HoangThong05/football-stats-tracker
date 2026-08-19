package com.hoangthong.footballtracker.security;

import com.hoangthong.footballtracker.repository.UserRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Doc header "Authorization: Bearer <token>", xac thuc bang JwtService.
 * Neu hop le, dat email (subject cua token) lam nguoi dung hien tai trong SecurityContext.
 * Token sai/het han -> bo qua, de request di tiep khong xac thuc (cac endpoint yeu cau
 * dang nhap se tu bi chan boi SecurityConfig).
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    /** Quyen danh dau phien dang nhap bang Google. Khong bat dau bang "ROLE_" nen khong
     *  anh huong toi hasRole() o SecurityConfig. */
    public static final String GOOGLE_SESSION = "GOOGLE_SESSION";

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthFilter(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith(BEARER_PREFIX)) {
            String token = header.substring(BEARER_PREFIX.length());
            try {
                Claims claims = jwtService.parseClaims(token);
                String email = claims.getSubject();
                String role = claims.get("role", String.class);

                /*
                 * Tra database xem tai khoan con hoat dong khong.
                 *
                 * Khong the chi kiem luc dang nhap: token song 24 gio, nen nguoi bi khoa
                 * van dung tiep binh thuong den het ngay hom do - nhu vay khong con goi la
                 * khoa nua. Vai tro cung the: vua bi thu quyen admin ma token cu van co
                 * ROLE_ADMIN ben trong.
                 *
                 * Doi lai la mot truy van moi request CO TOKEN (request cong khai khong
                 * vao nhanh nay). Tim theo email da co chi muc duy nhat nen rat nhe, va
                 * doi lai su dung dan la xung dang.
                 */
                var user = userRepository.findByEmail(email).orElse(null);
                if (user == null || !user.isEnabled()) {
                    SecurityContextHolder.clearContext();
                    filterChain.doFilter(request, response);
                    return;
                }

                /*
                 * Token phat truoc lan doi mat khau gan nhat thi khong con gia tri.
                 * Nho vay doi mat khau moi that su da duoc ke dang cam token cu ra ngoai,
                 * chu khong phai doi xong ma no van dung tiep den khi token het han.
                 */
                if (JwtService.tokenVersionOf(claims) != user.getTokenVersion()) {
                    SecurityContextHolder.clearContext();
                    filterChain.doFilter(request, response);
                    return;
                }

                // Lay vai tro tu DB chu khong tu token, de thu quyen co hieu luc ngay
                // Spring Security quy uoc quyen bat dau bang "ROLE_"; hasRole("ADMIN") -> "ROLE_ADMIN".
                role = user.getRole().name();
                var authorities = new java.util.ArrayList<SimpleGrantedAuthority>();
                authorities.add(new SimpleGrantedAuthority("ROLE_" + role));
                /*
                 * Danh dau phien nay dang nhap bang nut Google.
                 *
                 * Man doi mat khau dua vao day de biet co nen hoi "mat khau hien tai" khong.
                 * Hoi theo kieu tai khoan (tao bang Google hay khong) la sai: tai khoan
                 * dang ky bang mat khau tu lau roi sau nay dang nhap bang Google van bi hoi
                 * mat khau ma nguoi dung khong he go lan nao trong phien do.
                 */
                if (JwtService.viaGoogle(claims)) {
                    authorities.add(new SimpleGrantedAuthority(GOOGLE_SESSION));
                }

                var auth = new UsernamePasswordAuthenticationToken(email, null, authorities);
                SecurityContextHolder.getContext().setAuthentication(auth);
            } catch (Exception ex) {
                // Token khong hop le/het han -> khong set authentication, request coi nhu chua dang nhap.
                SecurityContextHolder.clearContext();
            }
        }

        filterChain.doFilter(request, response);
    }
}
