-- V3: Bang prediction cho PostgreSQL
CREATE TABLE IF NOT EXISTS prediction (
    id                    BIGSERIAL   NOT NULL,
    user_id               BIGINT      NOT NULL,
    match_id              BIGINT      NOT NULL,
    predicted_home_score  INT         NOT NULL,
    predicted_away_score  INT         NOT NULL,
    points                INT         NULL,
    created_at            TIMESTAMPTZ NOT NULL,
    updated_at            TIMESTAMPTZ NOT NULL,
    CONSTRAINT PK_prediction PRIMARY KEY (id),
    CONSTRAINT UQ_prediction_user_match UNIQUE (user_id, match_id),
    CONSTRAINT FK_prediction_user FOREIGN KEY (user_id) REFERENCES app_user (id),
    CONSTRAINT FK_prediction_match FOREIGN KEY (match_id) REFERENCES match_fixture (id)
);
