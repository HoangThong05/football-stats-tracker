package com.hoangthong.footballtracker.repository;

import com.hoangthong.footballtracker.entity.UserBadge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserBadgeRepository extends JpaRepository<UserBadge, Long> {

    List<UserBadge> findByUserId(Long userId);

    boolean existsByUserIdAndBadgeCode(Long userId, String badgeCode);
}
