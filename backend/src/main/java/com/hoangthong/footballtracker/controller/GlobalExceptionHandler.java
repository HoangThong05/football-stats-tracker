package com.hoangthong.footballtracker.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

/**
 * Chuyen loi thanh JSON { "message": "<ma loi>" } cho frontend.
 *
 * Vi sao can: application.properties da tat server.error.include-message, nen trang loi
 * mac dinh cua Spring KHONG con dua message ra client - de mot NullPointerException hay
 * loi CSDL bat ngo khong lo chi tiet noi bo (ten bang, cau SQL, duong dan lop...).
 *
 * Nhung frontend lai dua vao message de doi sang cau tieng nguoi dung (vd "invalid_email",
 * "rate_limited"). Nen o day BAT LAI ResponseStatusException - loai loi do CHINH TA nem
 * ra co chu dich - va tra lai dung ma do. Cac ma nay do minh tu dat nen an toan khi lo.
 *
 * KHONG bat Exception chung o day: lam vay se nuot ca cac loi 400 cua framework (JSON
 * hong, sai kieu tham so) va bien chung thanh 500. Chung cu de trang loi mac dinh xu ly -
 * gio message da bi giau nen khong con ro ri gi.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handle(ResponseStatusException ex) {
        // getReason() la chuoi minh tu dat luc nem (vd "rate_limited"), khong phai
        // thong tin noi bo - an toan de tra ve cho client.
        String reason = ex.getReason();
        // 5xx la loi phia may chu: van ghi log day du de con dieu tra, chi khong lo ra ngoai.
        if (ex.getStatusCode().is5xxServerError()) {
            log.error("Loi 5xx tu ResponseStatusException", ex);
        }
        return ResponseEntity.status(ex.getStatusCode())
                .body(Map.of("message", reason == null ? "" : reason));
    }
}
