package com.hoangthong.footballtracker.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Chuan hoa ten cho viec tim kiem.
 *
 * Day la phan quyet dinh tim co ra hay khong: bong da toan ten co dau, ma khong ai
 * go dau khi tim. Sai o day thi ca tinh nang coi nhu khong dung duoc.
 */
class PlayerIndexServiceTest {

    @Test
    void bo_dau_tieng_Viet() {
        assertThat(PlayerIndexService.normalize("Nguyễn Quang Hải")).isEqualTo("nguyen quang hai");
        assertThat(PlayerIndexService.normalize("Đoàn Văn Hậu")).isEqualTo("doan van hau");
    }

    @Test
    void bo_dau_cac_ngon_ngu_chau_Au() {
        assertThat(PlayerIndexService.normalize("Martínez")).isEqualTo("martinez");
        assertThat(PlayerIndexService.normalize("Ødegaard")).isEqualTo("odegaard");
        assertThat(PlayerIndexService.normalize("Højlund")).isEqualTo("hojlund");
        assertThat(PlayerIndexService.normalize("Lewandowski")).isEqualTo("lewandowski");
        assertThat(PlayerIndexService.normalize("Szczęsny")).isEqualTo("szczesny");
    }

    @Test
    void chu_gach_ngang_giua_than_chu_van_phai_ra_dung() {
        // NFD khong tach duoc nhung chu nay vi chung la ky tu doc lap, phai thay tay
        assertThat(PlayerIndexService.normalize("Ståle Ødegård")).isEqualTo("stale odegard");
        assertThat(PlayerIndexService.normalize("Łukasz")).isEqualTo("lukasz");
    }

    @Test
    void ha_chu_thuong_va_cat_khoang_trang_thua() {
        assertThat(PlayerIndexService.normalize("  Erling HAALAND  ")).isEqualTo("erling haaland");
    }

    @Test
    void chuoi_rong_hoac_null_khong_lam_vo() {
        assertThat(PlayerIndexService.normalize(null)).isEmpty();
        assertThat(PlayerIndexService.normalize("")).isEmpty();
    }
}
