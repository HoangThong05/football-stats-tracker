package com.hoangthong.footballtracker.repository;

import com.hoangthong.footballtracker.entity.ApiFootballSyncState;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApiFootballSyncStateRepository extends JpaRepository<ApiFootballSyncState, Long> {
}
