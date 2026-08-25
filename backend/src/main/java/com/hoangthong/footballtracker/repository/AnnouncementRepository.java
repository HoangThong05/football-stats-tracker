package com.hoangthong.footballtracker.repository;

import com.hoangthong.footballtracker.entity.Announcement;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    /** Cac thong bao gan day (moi nhat truoc) - cho chuong cua nguoi dung. */
    List<Announcement> findByCreatedAtAfterOrderByCreatedAtDesc(Instant since, Pageable pageable);
}
