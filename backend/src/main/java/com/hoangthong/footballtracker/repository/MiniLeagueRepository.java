package com.hoangthong.footballtracker.repository;

import com.hoangthong.footballtracker.entity.MiniLeague;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MiniLeagueRepository extends JpaRepository<MiniLeague, Long> {
    Optional<MiniLeague> findByInviteCode(String inviteCode);
    boolean existsByInviteCode(String inviteCode);
}
