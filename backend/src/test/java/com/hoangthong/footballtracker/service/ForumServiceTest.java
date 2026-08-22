package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.entity.ForumPost;
import com.hoangthong.footballtracker.entity.Role;
import com.hoangthong.footballtracker.entity.User;
import com.hoangthong.footballtracker.repository.ForumCommentRepository;
import com.hoangthong.footballtracker.repository.ForumPostRepository;
import com.hoangthong.footballtracker.repository.PostLikeRepository;
import com.hoangthong.footballtracker.repository.PostReportRepository;
import com.hoangthong.footballtracker.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ForumServiceTest {

    private ForumPostRepository postRepo;
    private PostLikeRepository likeRepo;
    private ForumService service;

    private final User an = user(1L, "an@example.com", Role.USER);
    private final User binh = user(2L, "binh@example.com", Role.USER);
    private final User admin = user(3L, "admin@example.com", Role.ADMIN);

    private static User user(long id, String email, Role role) {
        User u = new User(email, "hash");
        u.setRole(role);
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
        postRepo = mock(ForumPostRepository.class);
        likeRepo = mock(PostLikeRepository.class);
        ForumCommentRepository commentRepo = mock(ForumCommentRepository.class);
        PostReportRepository reportRepo = mock(PostReportRepository.class);
        UserRepository userRepo = mock(UserRepository.class);

        when(userRepo.findByEmail("an@example.com")).thenReturn(Optional.of(an));
        when(userRepo.findByEmail("binh@example.com")).thenReturn(Optional.of(binh));
        when(userRepo.findByEmail("admin@example.com")).thenReturn(Optional.of(admin));

        service = new ForumService(postRepo, commentRepo, likeRepo, reportRepo, userRepo);
    }

    private ForumPost baiCuaAn() {
        ForumPost post = new ForumPost(an, "noi dung", null);
        when(postRepo.findById(10L)).thenReturn(Optional.of(post));
        return post;
    }

    @Test
    void bai_trong_hoan_toan_thi_khong_dang_duoc() {
        assertThatThrownBy(() -> service.createPost("an@example.com", "   ", null))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("post_empty");
        verify(postRepo, never()).save(any());
    }

    /** Bai chi co anh, khong co chu - van hop le. */
    @Test
    void bai_chi_co_anh_van_dang_duoc() {
        service.createPost("an@example.com", "", "https://res.cloudinary.com/demo/image/upload/x.jpg");
        verify(postRepo).save(any(ForumPost.class));
    }

    /**
     * Chi nhan duong dan Cloudinary.
     *
     * Cho URL tuy y thi dien dan thanh cho gan link di noi khac, va "anh" co the la
     * bat cu thu gi tren mang - ke ca thu dung de theo doi nguoi xem.
     */
    @Test
    void chi_nhan_duong_dan_Cloudinary() {
        for (String xau : new String[]{
                "https://vi-du-khac.com/anh.jpg",
                "http://res.cloudinary.com/demo/x.jpg",
                "javascript:alert(1)"}) {
            assertThatThrownBy(() -> service.createPost("an@example.com", "chu", xau))
                    .as("url: %s", xau)
                    .hasMessageContaining("image_url_invalid");
        }
    }

    @Test
    void khong_xoa_duoc_bai_cua_nguoi_khac() {
        baiCuaAn();

        assertThatThrownBy(() -> service.deletePost("binh@example.com", 10L))
                .hasMessageContaining("not_your_post");
        verify(postRepo, never()).delete(any());
    }

    @Test
    void tac_gia_xoa_duoc_bai_cua_minh() {
        ForumPost post = baiCuaAn();

        service.deletePost("an@example.com", 10L);

        verify(postRepo).delete(post);
    }

    /** Admin xoa duoc bai bat ky - day la cong cu kiem duyet. */
    @Test
    void admin_xoa_duoc_bai_cua_nguoi_khac() {
        ForumPost post = baiCuaAn();

        service.deletePost("admin@example.com", 10L);

        verify(postRepo).delete(post);
    }

    /** Bai bi an coi nhu khong ton tai, khong the binh luan hay thich. */
    @Test
    void bai_da_bi_an_thi_khong_tuong_tac_duoc() {
        ForumPost post = baiCuaAn();
        post.setHidden(true);

        assertThatThrownBy(() -> service.comment("binh@example.com", 10L, "hay qua", null))
                .hasMessageContaining("post_not_found");
        assertThatThrownBy(() -> service.toggleLike("binh@example.com", 10L))
                .hasMessageContaining("post_not_found");
    }

    @Test
    void binh_luan_trong_thi_bi_tu_choi() {
        baiCuaAn();

        assertThatThrownBy(() -> service.comment("binh@example.com", 10L, "  ", null))
                .hasMessageContaining("comment_empty");
    }

    /** Bam thich lan hai la BO thich, khong phai them mot luot nua. */
    @Test
    void bam_thich_lan_hai_thi_bo_thich() {
        baiCuaAn();
        var daThich = new com.hoangthong.footballtracker.entity.PostLike(
                new ForumPost(an, "x", null), binh);
        when(likeRepo.findByPostIdAndUserId(anyLong(), any())).thenReturn(Optional.of(daThich));

        service.toggleLike("binh@example.com", 10L);

        verify(likeRepo).delete(daThich);
        verify(likeRepo, never()).save(any());
    }

    @Test
    void chua_thich_thi_bam_la_them_luot_thich() {
        baiCuaAn();
        when(likeRepo.findByPostIdAndUserId(anyLong(), any())).thenReturn(Optional.empty());

        service.toggleLike("binh@example.com", 10L);

        verify(likeRepo).save(any());
    }

    @Test
    void duong_dan_anh_rong_thi_thanh_null_chu_khong_loi() {
        assertThat(ForumService.cleanImageUrl("   ")).isNull();
        assertThat(ForumService.cleanImageUrl(null)).isNull();
    }
}
