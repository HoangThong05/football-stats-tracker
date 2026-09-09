package com.hoangthong.footballtracker.repository;

import com.hoangthong.footballtracker.entity.MaintenanceState;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MaintenanceStateRepository extends JpaRepository<MaintenanceState, Long> {
}
