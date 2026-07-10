package com.hoangthong.footballtracker.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;

/**
 * 1 luot du doan ti so cua 1 user cho 1 tran (tham chieu that toi match_fixture,
 * nen chi du doan duoc nhung tran da dong bo). User co the SUA du doan nhieu lan
 * mien la tran chua bat dau (kiem tra o PredictionService).
 *
 * points: null cho toi khi tran KET THUC va PredictionScoringService cham diem.
 * Cham diem: dung ti so = 3, dung ket qua (thang/hoa/thua) nhung sai ti so = 1, sai = 0.
 */
@Entity
@Table(name = "prediction", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "match_id"}))
public class Prediction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id", nullable = false)
    private MatchFixture match;

    @Column(name = "predicted_home_score", nullable = false)
    private int predictedHomeScore;

    @Column(name = "predicted_away_score", nullable = false)
    private int predictedAwayScore;

    /** Null = chua cham diem (tran chua ket thuc). */
    private Integer points;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();

    protected Prediction() {
        // JPA can
    }

    public Prediction(User user, MatchFixture match, int predictedHomeScore, int predictedAwayScore) {
        this.user = user;
        this.match = match;
        this.predictedHomeScore = predictedHomeScore;
        this.predictedAwayScore = predictedAwayScore;
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public MatchFixture getMatch() {
        return match;
    }

    public int getPredictedHomeScore() {
        return predictedHomeScore;
    }

    public int getPredictedAwayScore() {
        return predictedAwayScore;
    }

    /** Sua lai du doan (chi goi khi tran chua bat dau). */
    public void updateGuess(int homeScore, int awayScore) {
        this.predictedHomeScore = homeScore;
        this.predictedAwayScore = awayScore;
        this.updatedAt = Instant.now();
    }

    public Integer getPoints() {
        return points;
    }

    public void setPoints(Integer points) {
        this.points = points;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
