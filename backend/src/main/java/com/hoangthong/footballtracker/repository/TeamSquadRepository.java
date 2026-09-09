package com.hoangthong.footballtracker.repository;

import com.hoangthong.footballtracker.entity.TeamSquad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

public interface TeamSquadRepository extends JpaRepository<TeamSquad, Long> {

    /** Xoa cac doi KHONG map duoc sang API-Football (sportsDbTeamId null) -> lan sau sync lai. */
    @Modifying
    @Transactional
    void deleteBySportsDbTeamIdIsNull();
}
