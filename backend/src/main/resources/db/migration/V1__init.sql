-- V1: Luoc do ban dau cho PostgreSQL

CREATE TABLE app_user (
    id            BIGSERIAL      NOT NULL,
    email         VARCHAR(255)   NOT NULL,
    password_hash VARCHAR(255)   NOT NULL,
    created_at    TIMESTAMPTZ    NOT NULL,
    CONSTRAINT PK_app_user PRIMARY KEY (id),
    CONSTRAINT UQ_app_user_email UNIQUE (email)
);

CREATE TABLE favorite_team (
    id         BIGSERIAL      NOT NULL,
    user_id    BIGINT         NOT NULL,
    team_id    BIGINT         NOT NULL,
    team_name  VARCHAR(255)   NOT NULL,
    team_crest VARCHAR(255)   NULL,
    created_at TIMESTAMPTZ    NOT NULL,
    CONSTRAINT PK_favorite_team PRIMARY KEY (id),
    CONSTRAINT UQ_favorite_team_user_team UNIQUE (user_id, team_id),
    CONSTRAINT FK_favorite_team_user FOREIGN KEY (user_id) REFERENCES app_user (id)
);

CREATE TABLE match_fixture (
    id           BIGINT         NOT NULL,
    competition  VARCHAR(255)   NOT NULL,
    utc_date     TIMESTAMPTZ    NOT NULL,
    status       VARCHAR(255)   NOT NULL,
    matchday     INT            NULL,
    home_team_id BIGINT         NOT NULL,
    home_team    VARCHAR(255)   NULL,
    home_crest   VARCHAR(255)   NULL,
    away_team_id BIGINT         NOT NULL,
    away_team    VARCHAR(255)   NULL,
    away_crest   VARCHAR(255)   NULL,
    home_score   INT            NULL,
    away_score   INT            NULL,
    updated_at   TIMESTAMPTZ    NOT NULL,
    CONSTRAINT PK_match_fixture PRIMARY KEY (id)
);

CREATE TABLE sent_notification (
    id       BIGSERIAL   NOT NULL,
    user_id  BIGINT      NOT NULL,
    match_id BIGINT      NOT NULL,
    sent_at  TIMESTAMPTZ NOT NULL,
    CONSTRAINT PK_sent_notification PRIMARY KEY (id),
    CONSTRAINT UQ_sent_notification_user_match UNIQUE (user_id, match_id)
);
