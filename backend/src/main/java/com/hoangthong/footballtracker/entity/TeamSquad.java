package com.hoangthong.footballtracker.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Cache squad lay tu TheSportsDB, khoa chinh la teamId cua football-data.org
 * (khong phai idTeam cua TheSportsDB - 2 he thong ID khac nhau).
 */
@Entity
@Table(name = "team_squad")
public class TeamSquad {

    @Id
    private Long teamId; // = football-data.org team id

    private String sportsDbTeamId; // cache lai de lan sau khong phai search lai theo ten

    @ElementCollection
    @CollectionTable(name = "team_squad_players", joinColumns = @JoinColumn(name = "team_id"))
    private List<SquadPlayer> players = new ArrayList<>();

    private Instant lastSyncedAt;

    protected TeamSquad() {}

    public TeamSquad(Long teamId) {
        this.teamId = teamId;
    }

    public Long getTeamId() { return teamId; }
    public String getSportsDbTeamId() { return sportsDbTeamId; }
    public void setSportsDbTeamId(String sportsDbTeamId) { this.sportsDbTeamId = sportsDbTeamId; }
    public List<SquadPlayer> getPlayers() { return players; }
    public void setPlayers(List<SquadPlayer> players) { this.players = players; }
    public Instant getLastSyncedAt() { return lastSyncedAt; }
    public void setLastSyncedAt(Instant lastSyncedAt) { this.lastSyncedAt = lastSyncedAt; }
}