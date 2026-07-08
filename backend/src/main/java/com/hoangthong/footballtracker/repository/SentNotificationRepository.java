package com.hoangthong.footballtracker.repository;

import com.hoangthong.footballtracker.entity.SentNotification;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SentNotificationRepository extends JpaRepository<SentNotification, Long> {

    boolean existsByUserIdAndMatchId(long userId, long matchId);
}
