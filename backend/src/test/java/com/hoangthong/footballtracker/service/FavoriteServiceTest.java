package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.dto.FavoriteTeamDto;
import com.hoangthong.footballtracker.dto.FollowRequest;
import com.hoangthong.footballtracker.entity.FavoriteTeam;
import com.hoangthong.footballtracker.entity.User;
import com.hoangthong.footballtracker.repository.FavoriteTeamRepository;
import com.hoangthong.footballtracker.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class FavoriteServiceTest {

    private static final String EMAIL = "an@example.com";

    private FavoriteTeamRepository favoriteRepository;
    private UserRepository userRepository;
    private FavoriteService service;
    private User user;

    @BeforeEach
    void setUp() {
        favoriteRepository = mock(FavoriteTeamRepository.class);
        userRepository = mock(UserRepository.class);
        service = new FavoriteService(favoriteRepository, userRepository);

        user = new User(EMAIL, "hashed");
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
    }

    @Test
    void theo_doi_doi_moi_thi_luu_va_tra_ve_thong_tin_doi() {
        when(favoriteRepository.existsByUserIdAndTeamId(any(), anyLong())).thenReturn(false);
        when(favoriteRepository.save(any(FavoriteTeam.class))).thenAnswer(inv -> inv.getArgument(0));

        FavoriteTeamDto dto = service.follow(EMAIL, new FollowRequest(57, "Arsenal FC", "https://crest/57.png"));

        assertThat(dto.teamId()).isEqualTo(57);
        assertThat(dto.teamName()).isEqualTo("Arsenal FC");
        assertThat(dto.teamCrest()).isEqualTo("https://crest/57.png");
        verify(favoriteRepository).save(any(FavoriteTeam.class));
    }

    @Test
    void theo_doi_doi_da_theo_doi_thi_tra_409_va_khong_luu_trung() {
        when(favoriteRepository.existsByUserIdAndTeamId(any(), anyLong())).thenReturn(true);

        assertThatThrownBy(() -> service.follow(EMAIL, new FollowRequest(57, "Arsenal FC", null)))
                .isInstanceOf(ResponseStatusException.class)
                .hasFieldOrPropertyWithValue("statusCode", HttpStatus.CONFLICT);

        verify(favoriteRepository, never()).save(any());
    }

    @Test
    void bo_theo_doi_doi_chua_tung_theo_doi_thi_tra_404() {
        when(favoriteRepository.findByUserIdAndTeamId(any(), anyLong())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.unfollow(EMAIL, 999))
                .isInstanceOf(ResponseStatusException.class)
                .hasFieldOrPropertyWithValue("statusCode", HttpStatus.NOT_FOUND);

        verify(favoriteRepository, never()).delete(any());
    }

    @Test
    void bo_theo_doi_thanh_cong_thi_xoa_ban_ghi() {
        FavoriteTeam favorite = new FavoriteTeam(user, 57, "Arsenal FC", null);
        when(favoriteRepository.findByUserIdAndTeamId(any(), anyLong())).thenReturn(Optional.of(favorite));

        service.unfollow(EMAIL, 57);

        verify(favoriteRepository).delete(favorite);
    }

    @Test
    void liet_ke_doi_yeu_thich_cua_dung_user() {
        when(favoriteRepository.findByUserId(any())).thenReturn(List.of(
                new FavoriteTeam(user, 57, "Arsenal FC", "c1"),
                new FavoriteTeam(user, 5, "Bayern", "c2")));

        List<FavoriteTeamDto> result = service.listFavorites(EMAIL);

        assertThat(result).extracting(FavoriteTeamDto::teamName).containsExactly("Arsenal FC", "Bayern");
    }

    @Test
    void user_khong_ton_tai_thi_tra_401() {
        when(userRepository.findByEmail("ma@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.listFavorites("ma@example.com"))
                .isInstanceOf(ResponseStatusException.class)
                .hasFieldOrPropertyWithValue("statusCode", HttpStatus.UNAUTHORIZED);
    }
}
