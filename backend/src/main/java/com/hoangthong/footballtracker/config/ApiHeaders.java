package com.hoangthong.footballtracker.config;

import java.util.List;

/**
 * Ten cac header tu dat ma API tra ve.
 *
 * Gom mot cho vi moi header phai xuat hien o HAI noi: controller gan gia tri, va
 * WebCorsConfig khai bao cho phep doc. Thieu ben CORS thi trinh duyet van nhan header
 * nhung CHAN JavaScript doc no - res.headers.get() tra ve null ma khong bao loi gi,
 * rat kho lan ra. Viet roi hai cho thi som muon cung lech.
 */
public final class ApiHeaders {

    private ApiHeaders() {
    }

    /** Nhan mua giai dang hien, vd "2025/26". */
    public static final String SEASON_LABEL = "X-Season-Label";

    /** Ngay khai mac mua giai (ISO yyyy-MM-dd), dung de dem nguoc luc trai mua. */
    public static final String SEASON_START = "X-Season-Start";

    /** Thoi diem THUC SU goi nguon du lieu (ISO-8601), dung de hien "Cap nhat luc HH:mm". */
    public static final String DATA_FETCHED_AT = "X-Data-Fetched-At";

    /** Danh sach cho WebCorsConfig - them header moi o tren thi nho them vao day. */
    public static final List<String> EXPOSED = List.of(SEASON_LABEL, SEASON_START, DATA_FETCHED_AT);
}
