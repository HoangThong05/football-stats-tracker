/* ============================================================================
   V1 - Luoc do ban dau: 4 bang cua Football Stats Tracker

   File nay do FLYWAY tu dong chay khi app khoi dong (khong can chay tay).
   Flyway ghi lai da chay migration nao trong bang flyway_schema_history,
   nen moi migration chi chay DUNG 1 LAN.

   LUU Y: KHONG dat CREATE DATABASE / USE / IF OBJECT_ID / GO o day.
   - Database phai duoc tao san (Flyway ket noi vao database co san).
   - Flyway tu quan ly viec chay 1 lan nen khong can IF ... IS NULL.
   ============================================================================ */

-- 1) app_user: tai khoan nguoi dung (email duy nhat, mat khau bam BCrypt)
CREATE TABLE app_user (
    id            BIGINT         IDENTITY(1,1) NOT NULL,
    email         VARCHAR(255)   NOT NULL,
    password_hash VARCHAR(255)   NOT NULL,
    created_at    DATETIMEOFFSET NOT NULL,
    CONSTRAINT PK_app_user PRIMARY KEY (id),
    CONSTRAINT UQ_app_user_email UNIQUE (email)
);

-- 2) favorite_team: doi bong 1 user theo doi (FK -> app_user, khong trung doi)
CREATE TABLE favorite_team (
    id         BIGINT         IDENTITY(1,1) NOT NULL,
    user_id    BIGINT         NOT NULL,
    team_id    BIGINT         NOT NULL,
    team_name  VARCHAR(255)   NOT NULL,
    team_crest VARCHAR(255)   NULL,
    created_at DATETIMEOFFSET NOT NULL,
    CONSTRAINT PK_favorite_team PRIMARY KEY (id),
    CONSTRAINT UQ_favorite_team_user_team UNIQUE (user_id, team_id),
    CONSTRAINT FK_favorite_team_user FOREIGN KEY (user_id) REFERENCES app_user (id)
);

-- 3) match_fixture: tran dau dong bo tu football-data.org (id = khoa tu nhien)
CREATE TABLE match_fixture (
    id           BIGINT         NOT NULL,
    competition  VARCHAR(255)   NOT NULL,
    utc_date     DATETIMEOFFSET NOT NULL,
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
    updated_at   DATETIMEOFFSET NOT NULL,
    CONSTRAINT PK_match_fixture PRIMARY KEY (id)
);

-- 4) sent_notification: danh dau email da gui (chong gui trung 1 tran cho 1 user)
CREATE TABLE sent_notification (
    id       BIGINT         IDENTITY(1,1) NOT NULL,
    user_id  BIGINT         NOT NULL,
    match_id BIGINT         NOT NULL,
    sent_at  DATETIMEOFFSET NOT NULL,
    CONSTRAINT PK_sent_notification PRIMARY KEY (id),
    CONSTRAINT UQ_sent_notification_user_match UNIQUE (user_id, match_id)
);
