/* ============================================================================
   Football Stats Tracker - Luoc do CSDL (SQL Server)
   ----------------------------------------------------------------------------
   File nay mo ta TAT CA cac bang ma ung dung su dung, de ban:
     - Nhin duoc tong the co bao nhieu bang va quan he giua chung
     - Tu tao lai schema tren mot may/DB khac (chay bang SSMS)

   LUU Y: Khi chay ung dung, Hibernate (spring.jpa.hibernate.ddl-auto=update)
   se TU DONG tao cac bang nay theo entity Java. File SQL nay la ban mo ta
   "tuong duong bang tay" cho muc dich hoc tap / tai lieu / khoi tao thu cong.
   Neu muon dung file nay lam nguon chinh thay vi Hibernate tu tao, xem ghi chu
   o cuoi file.

   Tong cong 4 bang:
     1. app_user          - tai khoan nguoi dung (dang nhap JWT)
     2. favorite_team     - doi bong ma moi user theo doi
     3. match_fixture     - tran dau dong bo tu football-data.org (job @Scheduled)
     4. sent_notification - danh dau email da gui (chong gui trung)
   ============================================================================ */

-- Tao database neu chua co, roi chuyen sang dung no.
IF DB_ID('football_tracker') IS NULL
    CREATE DATABASE football_tracker;
GO

USE football_tracker;
GO


/* ----------------------------------------------------------------------------
   1) app_user: tai khoan nguoi dung
   - id: khoa chinh, tu tang (IDENTITY)
   - email: duy nhat (khong cho 2 tai khoan trung email)
   - password_hash: mat khau da bam bang BCrypt (KHONG luu mat khau goc)
---------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.app_user', 'U') IS NULL
CREATE TABLE dbo.app_user (
    id            BIGINT         IDENTITY(1,1) NOT NULL,
    email         VARCHAR(255)   NOT NULL,
    password_hash VARCHAR(255)   NOT NULL,
    created_at    DATETIMEOFFSET NOT NULL,
    CONSTRAINT PK_app_user PRIMARY KEY (id),
    CONSTRAINT UQ_app_user_email UNIQUE (email)
);
GO


/* ----------------------------------------------------------------------------
   2) favorite_team: doi bong 1 user dang theo doi
   - user_id: khoa ngoai tro toi app_user(id)
   - team_id: id doi ben football-data.org (khong phai khoa ngoai noi bo)
   - (user_id, team_id) duy nhat: 1 user khong theo doi trung 1 doi 2 lan
   - team_name / team_crest: luu san de hien thi khong can goi lai API ngoai
---------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.favorite_team', 'U') IS NULL
CREATE TABLE dbo.favorite_team (
    id         BIGINT         IDENTITY(1,1) NOT NULL,
    user_id    BIGINT         NOT NULL,
    team_id    BIGINT         NOT NULL,
    team_name  VARCHAR(255)   NOT NULL,
    team_crest VARCHAR(255)   NULL,
    created_at DATETIMEOFFSET NOT NULL,
    CONSTRAINT PK_favorite_team PRIMARY KEY (id),
    CONSTRAINT UQ_favorite_team_user_team UNIQUE (user_id, team_id),
    CONSTRAINT FK_favorite_team_user FOREIGN KEY (user_id) REFERENCES dbo.app_user (id)
);
GO


/* ----------------------------------------------------------------------------
   3) match_fixture: tran dau, dong bo dinh ky tu football-data.org
   - id: KHONG tu tang. Dung luon id tran ben football-data (khoa tu nhien)
         de moi lan dong bo co the "upsert" (co thi cap nhat, chua co thi them).
   - home_team_id / away_team_id: doi chieu voi favorite_team.team_id khi gui email
   - home_score / away_score: NULL neu tran chua da xong
   - status: SCHEDULED / TIMED / IN_PLAY / FINISHED ...
---------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.match_fixture', 'U') IS NULL
CREATE TABLE dbo.match_fixture (
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
GO


/* ----------------------------------------------------------------------------
   4) sent_notification: da gui email nhac tran (match_id) cho user (user_id)
   - (user_id, match_id) duy nhat: job chay lai moi gio se khong gui trung
---------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.sent_notification', 'U') IS NULL
CREATE TABLE dbo.sent_notification (
    id       BIGINT         IDENTITY(1,1) NOT NULL,
    user_id  BIGINT         NOT NULL,
    match_id BIGINT         NOT NULL,
    sent_at  DATETIMEOFFSET NOT NULL,
    CONSTRAINT PK_sent_notification PRIMARY KEY (id),
    CONSTRAINT UQ_sent_notification_user_match UNIQUE (user_id, match_id)
);
GO


/* ============================================================================
   GHI CHU: Neu muon dung file SQL nay lam nguon chinh (thay vi de Hibernate
   tu tao bang), doi trong application.properties:
       spring.jpa.hibernate.ddl-auto=validate
   -> luc do chay app, Hibernate chi KIEM TRA bang khop voi entity, khong tu sua.
   Ban se phai chay file schema.sql nay TRUOC khi chay app.
   ============================================================================ */
