package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.client.ApiQuotaTracker;
import com.hoangthong.footballtracker.dto.UserSummaryDto;
import com.hoangthong.footballtracker.entity.Role;
import com.hoangthong.footballtracker.entity.User;
import com.hoangthong.footballtracker.repository.MatchFixtureRepository;
import com.hoangthong.footballtracker.repository.MiniLeagueRepository;
import com.hoangthong.footballtracker.repository.PredictionRepository;
import com.hoangthong.footballtracker.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.cache.CacheManager;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Tap trung vao HAI CHOT CHAN cua changeRole. Sai o day thi admin tu khoa minh ra ngoai
 * va chi con cach mo SQL Editor sua tay - dung loai loi nen co test bao ve.
 */
class AdminServiceTest {

    private static final String TOI = "admin@app.com";
    private static final String NGUOI_KHAC = "user@app.com";

    private UserRepository userRepository;
    private AdminService service;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        service = new AdminService(
                userRepository,
                mock(PredictionRepository.class),
                mock(MiniLeagueRepository.class),
                mock(MatchFixtureRepository.class),
                mock(CacheManager.class),
                new ApiQuotaTracker(),
                mock(MatchSyncService.class));
    }

    private User user(long id, String email, Role role) {
        User u = new User(email, "hash");
        u.setRole(role);
        // id do JPA sinh, test phai gan bang phan chieu
        try {
            var field = User.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(u, id);
        } catch (ReflectiveOperationException ex) {
            throw new IllegalStateException(ex);
        }
        return u;
    }

    @Test
    void khong_cho_tu_ha_quyen_cua_chinh_minh() {
        User me = user(1, TOI, Role.ADMIN);
        when(userRepository.findById(1L)).thenReturn(Optional.of(me));

        assertThatThrownBy(() -> service.changeRole(1, "USER", TOI))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("cannot_demote_self");

        verify(userRepository, never()).save(any());
    }

    @Test
    void khong_cho_ha_quyen_admin_cuoi_cung() {
        User admin = user(2, NGUOI_KHAC, Role.ADMIN);
        when(userRepository.findById(2L)).thenReturn(Optional.of(admin));
        when(userRepository.countByRole(Role.ADMIN)).thenReturn(1L);

        assertThatThrownBy(() -> service.changeRole(2, "USER", TOI))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("last_admin");

        verify(userRepository, never()).save(any());
    }

    @Test
    void ha_quyen_duoc_khi_van_con_admin_khac() {
        User admin = user(2, NGUOI_KHAC, Role.ADMIN);
        when(userRepository.findById(2L)).thenReturn(Optional.of(admin));
        when(userRepository.countByRole(Role.ADMIN)).thenReturn(2L);

        UserSummaryDto result = service.changeRole(2, "USER", TOI);

        assertThat(result.role()).isEqualTo("USER");
        verify(userRepository).save(admin);
    }

    @Test
    void cap_quyen_admin_binh_thuong() {
        User u = user(3, NGUOI_KHAC, Role.USER);
        when(userRepository.findById(3L)).thenReturn(Optional.of(u));

        UserSummaryDto result = service.changeRole(3, "ADMIN", TOI);

        assertThat(result.role()).isEqualTo("ADMIN");
        verify(userRepository).save(u);
    }

    /** Tu NANG quyen chinh minh thi khong sao - chot chan chi chan HA quyen. */
    @Test
    void tu_nang_quyen_chinh_minh_thi_van_cho() {
        User me = user(1, TOI, Role.USER);
        when(userRepository.findById(1L)).thenReturn(Optional.of(me));

        assertThat(service.changeRole(1, "ADMIN", TOI).role()).isEqualTo("ADMIN");
    }

    @Test
    void vai_tro_khong_hop_le_thi_bao_loi() {
        assertThatThrownBy(() -> service.changeRole(1, "SUPERUSER", TOI))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("invalid_role");
    }
}
