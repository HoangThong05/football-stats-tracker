package com.hoangthong.footballtracker.service;

import java.util.regex.Pattern;

/**
 * Nhac ten (@) trong bai viet / binh luan / chat / tin nhan.
 *
 * App khong co username duy nhat (chi co ten hien thi co the trung + co dau cach), nen mot
 * luot nhac duoc luu THANG trong noi dung duoi dang token: {@code @[Ten hien thi](uid:123)}.
 * Token nay khong nhap nham duoc bang tay: no do o tim goi y sinh ra khi chon mot nguoi ban.
 * Nho gan san id, ta hien duoc link chuan (du ten trung) va biet chinh xac ai duoc nhac.
 */
public final class Mentions {

    /** {@code @[Ten](uid:123)} - nhom 1 = ten hien thi, nhom 2 = id nguoi dung. */
    public static final Pattern TOKEN = Pattern.compile("@\\[([^\\]\\n]{1,80})\\]\\(uid:(\\d{1,18})\\)");

    private Mentions() {
    }

    /**
     * Doi token thanh {@code @Ten} de hien van ban THUAN (thong bao day, dong xem truoc trong
     * hop thu...). Cho hien day du co link thi frontend tu tach token va dung {@link #TOKEN}.
     */
    public static String toDisplay(String text) {
        if (text == null) {
            return null;
        }
        return TOKEN.matcher(text).replaceAll("@$1");
    }
}
