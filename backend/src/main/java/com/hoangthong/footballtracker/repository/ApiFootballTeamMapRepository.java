package com.hoangthong.footballtracker.repository;

import com.hoangthong.footballtracker.entity.ApiFootballTeamMap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.Optional;

public interface ApiFootballTeamMapRepository extends JpaRepository<ApiFootballTeamMap, String> {

    /** Lan cap nhat gan nhat cua CA bang -> dung de biet co can goi lai API-Football khong. */
    @Query("SELECT MAX(m.updatedAt) FROM ApiFootballTeamMap m")
    Optional<Instant> findLastUpdatedAt();
}
