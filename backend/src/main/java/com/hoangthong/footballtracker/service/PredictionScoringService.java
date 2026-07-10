package com.hoangthong.footballtracker.service;

import com.hoangthong.footballtracker.entity.MatchFixture;
import com.hoangthong.footballtracker.entity.Prediction;
import com.hoangthong.footballtracker.repository.MatchFixtureRepository;
import com.hoangthong.footballtracker.repository.PredictionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Job dinh ky: voi moi tran da FINISHED, cham diem cac du doan CHUA cham (points == null).
 * Luat: dung chinh xac ti so = 3 diem; dung ket qua (thang/hoa/thua) nhung sai ti so = 1 diem;
 * sai hoan toan = 0 diem.
 */
@Service
public class PredictionScoringService {

    private static final Logger log = LoggerFactory.getLogger(PredictionScoringService.class);

    static final int POINTS_EXACT_SCORE = 3;
    static final int POINTS_CORRECT_OUTCOME = 1;
    static final int POINTS_WRONG = 0;

    private final MatchFixtureRepository matchRepository;
    private final PredictionRepository predictionRepository;

    public PredictionScoringService(MatchFixtureRepository matchRepository, PredictionRepository predictionRepository) {
        this.matchRepository = matchRepository;
        this.predictionRepository = predictionRepository;
    }

    @Scheduled(
            initialDelayString = "${app.predictions.scoring-initial-delay-ms:20000}",
            fixedDelayString = "${app.predictions.scoring-interval-ms:1800000}")
    public void scoreFinishedMatches() {
        List<MatchFixture> finished = matchRepository.findByStatus("FINISHED");
        int scoredCount = 0;

        for (MatchFixture match : finished) {
            if (match.getHomeScore() == null || match.getAwayScore() == null) {
                continue; // du lieu chua day du, cho lan dong bo sau
            }

            List<Prediction> unscored = predictionRepository.findByMatchAndPointsIsNull(match);
            for (Prediction prediction : unscored) {
                int points = computePoints(
                        prediction.getPredictedHomeScore(), prediction.getPredictedAwayScore(),
                        match.getHomeScore(), match.getAwayScore());
                prediction.setPoints(points);
                predictionRepository.save(prediction);
                scoredCount++;
            }
        }

        if (scoredCount > 0) {
            log.info("Da cham diem {} luot du doan.", scoredCount);
        }
    }

    /** Tach rieng thanh method thuan de test khong can DB. */
    int computePoints(int predictedHome, int predictedAway, int actualHome, int actualAway) {
        if (predictedHome == actualHome && predictedAway == actualAway) {
            return POINTS_EXACT_SCORE;
        }
        if (outcomeOf(predictedHome, predictedAway) == outcomeOf(actualHome, actualAway)) {
            return POINTS_CORRECT_OUTCOME;
        }
        return POINTS_WRONG;
    }

    private enum Outcome { HOME_WIN, AWAY_WIN, DRAW }

    private Outcome outcomeOf(int home, int away) {
        if (home > away) return Outcome.HOME_WIN;
        if (home < away) return Outcome.AWAY_WIN;
        return Outcome.DRAW;
    }
}
