package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.entity.Friendship;
import com.hoangthong.footballtracker.entity.User;
import com.hoangthong.footballtracker.repository.FriendshipRepository;
import com.hoangthong.footballtracker.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class FriendshipServiceTest {

    private FriendshipRepository friendshipRepository;
    private FriendshipService service;

    private final User an = user(1L, "an@example.com");
    private final User binh = user(2L, "binh@example.com");

    private static User user(long id, String email) {
        User u = new User(email, "hash");
        try {
            var f = User.class.getDeclaredField("id");
            f.setAccessible(true);
            f.set(u, id);
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException(e);
        }
        return u;
    }

    @BeforeEach
    void setUp() {
        UserRepository userRepository = mock(UserRepository.class);
        friendshipRepository = mock(FriendshipRepository.class);
        when(userRepository.findByEmail("an@example.com")).thenReturn(Optional.of(an));
        when(userRepository.findByEmail("binh@example.com")).thenReturn(Optional.of(binh));
        when(userRepository.findById(2L)).thenReturn(Optional.of(binh));
        when(userRepository.findById(1L)).thenReturn(Optional.of(an));
        when(friendshipRepository.findBetween(any(), any())).thenReturn(Optional.empty());
        service = new FriendshipService(userRepository, friendshipRepository,
                org.mockito.Mockito.mock(WebPushService.class));
    }

    @Test
    void gui_loi_moi_tao_quan_he_dang_cho() {
        service.request("an@example.com", 2L);
        verify(friendshipRepository).save(any(Friendship.class));
    }

    @Test
    void khong_the_tu_ket_ban_voi_chinh_minh() {
        assertThatThrownBy(() -> service.request("an@example.com", 1L))
                .hasMessageContaining("cannot_friend_self");
        verify(friendshipRepository, never()).save(any());
    }

    /**
     * Hai nguoi cung bam "Ket ban" thi thanh ban luon.
     *
     * Khong xu ly the thi ho ket o trang thai cho lan nhau mai ma khong ai bam dong y
     * duoc - vi ca hai deu la NGUOI GUI, ma nguoi gui thi khong duoc phep tu dong y.
     */
    @Test
    void doi_phuong_da_moi_truoc_thi_bam_ket_ban_la_dong_y_luon() {
        Friendship binhMoiAn = new Friendship(binh, an);
        when(friendshipRepository.findBetween(1L, 2L)).thenReturn(Optional.of(binhMoiAn));

        service.request("an@example.com", 2L);

        assertThat(binhMoiAn.getStatus()).isEqualTo(Friendship.Status.ACCEPTED);
    }

    @Test
    void gui_lai_khi_da_gui_roi_thi_bi_tu_choi() {
        when(friendshipRepository.findBetween(1L, 2L)).thenReturn(Optional.of(new Friendship(an, binh)));

        assertThatThrownBy(() -> service.request("an@example.com", 2L))
                .hasMessageContaining("friend_request_exists");
    }

    /** Nguoi GUI khong duoc tu bam dong y loi moi cua chinh minh. */
    @Test
    void nguoi_gui_khong_the_tu_dong_y() {
        when(friendshipRepository.findBetween(1L, 2L)).thenReturn(Optional.of(new Friendship(an, binh)));

        assertThatThrownBy(() -> service.accept("an@example.com", 2L))
                .hasMessageContaining("request_not_found");
    }

    @Test
    void nguoi_nhan_dong_y_thi_thanh_ban() {
        Friendship f = new Friendship(binh, an);
        when(friendshipRepository.findBetween(1L, 2L)).thenReturn(Optional.of(f));

        service.accept("an@example.com", 2L);

        assertThat(f.getStatus()).isEqualTo(Friendship.Status.ACCEPTED);
    }

    @Test
    void trang_thai_quan_he_nhin_tu_hai_phia() {
        Friendship anMoiBinh = new Friendship(an, binh);
        when(friendshipRepository.findBetween(any(), any())).thenReturn(Optional.of(anMoiBinh));

        assertThat(service.relationWith("an@example.com", 2L))
                .isEqualTo(FriendshipService.Relation.PENDING_SENT);
        assertThat(service.relationWith("binh@example.com", 1L))
                .isEqualTo(FriendshipService.Relation.PENDING_RECEIVED);
    }

    @Test
    void xem_ho_so_cua_chinh_minh_thi_khong_co_nut_ket_ban() {
        assertThat(service.relationWith("an@example.com", 1L))
                .isEqualTo(FriendshipService.Relation.SELF);
    }

    /** Khach chua dang nhap van xem duoc ho so, chi la khong co quan he nao. */
    @Test
    void khach_chua_dang_nhap_thi_quan_he_la_NONE() {
        assertThat(service.relationWith(null, 2L)).isEqualTo(FriendshipService.Relation.NONE);
    }
}
