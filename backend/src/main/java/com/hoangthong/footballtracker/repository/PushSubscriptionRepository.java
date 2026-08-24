package com.hoangthong.footballtracker.repository;

import com.hoangthong.footballtracker.entity.PushSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, Long> {

    Optional<PushSubscription> findByEndpoint(String endpoint);

    /** Moi dang ky (thiet bi) cua mot nguoi - de day toi tat ca noi ho da bat thong bao. */
    List<PushSubscription> findByUserId(Long userId);

    // @Transactional: derived delete phai chay trong giao dich, khong thi nem loi
    @Transactional
    void deleteByEndpoint(String endpoint);

    /** Xoa dang ky CHI khi endpoint thuoc dung nguoi goi - tranh xoa nham cua nguoi khac. */
    @Transactional
    void deleteByEndpointAndUserId(String endpoint, Long userId);
}
