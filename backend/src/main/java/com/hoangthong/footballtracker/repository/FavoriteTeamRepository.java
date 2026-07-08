package com.hoangthong.footballtracker.repository;

import com.hoangthong.footballtracker.entity.FavoriteTeam;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface FavoriteTeamRepository extends JpaRepository<FavoriteTeam, Long> {

    List<FavoriteTeam> findByUserId(Long userId);

    Optional<FavoriteTeam> findByUserIdAndTeamId(Long userId, long teamId);

    boolean existsByUserIdAndTeamId(Long userId, long teamId);

    // Tim moi luot theo doi thuoc mot nhom team id (dung khi gui thong bao tran sap da).
    List<FavoriteTeam> findByTeamIdIn(Collection<Long> teamIds);
}
