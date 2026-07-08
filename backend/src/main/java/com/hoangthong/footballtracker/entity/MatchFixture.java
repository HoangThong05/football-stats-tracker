package com.hoangthong.footballtracker.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * 1 tran dau da luu vao DB (dong bo dinh ky tu football-data.org).
 * PK dung luon match id ben football-data (khoa tu nhien) de upsert de dang.
 * Luu them team id de doi chieu voi favorite_team khi gui thong bao.
 */
@Entity
@Table(name = "match_fixture")
public class MatchFixture {

    @Id
    private long id;

    @Column(nullable = false)
    private String competition;

    @Column(nullable = false)
    private Instant utcDate;

    @Column(nullable = false)
    private String status;

    private Integer matchday;

    private long homeTeamId;
    private String homeTeam;
    private String homeCrest;

    private long awayTeamId;
    private String awayTeam;
    private String awayCrest;

    private Integer homeScore;
    private Integer awayScore;

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();

    protected MatchFixture() {
        // JPA can
    }

    public MatchFixture(long id) {
        this.id = id;
    }

    public long getId() {
        return id;
    }

    public String getCompetition() {
        return competition;
    }

    public void setCompetition(String competition) {
        this.competition = competition;
    }

    public Instant getUtcDate() {
        return utcDate;
    }

    public void setUtcDate(Instant utcDate) {
        this.utcDate = utcDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getMatchday() {
        return matchday;
    }

    public void setMatchday(Integer matchday) {
        this.matchday = matchday;
    }

    public long getHomeTeamId() {
        return homeTeamId;
    }

    public void setHomeTeamId(long homeTeamId) {
        this.homeTeamId = homeTeamId;
    }

    public String getHomeTeam() {
        return homeTeam;
    }

    public void setHomeTeam(String homeTeam) {
        this.homeTeam = homeTeam;
    }

    public String getHomeCrest() {
        return homeCrest;
    }

    public void setHomeCrest(String homeCrest) {
        this.homeCrest = homeCrest;
    }

    public long getAwayTeamId() {
        return awayTeamId;
    }

    public void setAwayTeamId(long awayTeamId) {
        this.awayTeamId = awayTeamId;
    }

    public String getAwayTeam() {
        return awayTeam;
    }

    public void setAwayTeam(String awayTeam) {
        this.awayTeam = awayTeam;
    }

    public String getAwayCrest() {
        return awayCrest;
    }

    public void setAwayCrest(String awayCrest) {
        this.awayCrest = awayCrest;
    }

    public Integer getHomeScore() {
        return homeScore;
    }

    public void setHomeScore(Integer homeScore) {
        this.homeScore = homeScore;
    }

    public Integer getAwayScore() {
        return awayScore;
    }

    public void setAwayScore(Integer awayScore) {
        this.awayScore = awayScore;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
