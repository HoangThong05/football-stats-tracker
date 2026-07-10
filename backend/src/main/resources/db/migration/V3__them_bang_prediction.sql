/* ============================================================================
   V3 - Bang prediction: nguoi dung du doan ti so tran dau

   - FK toi app_user va match_fixture: chi du doan duoc tran da dong bo (co that).
   - (user_id, match_id) duy nhat: 1 nguoi chi co 1 du doan cho 1 tran (co the SUA).
   - points: NULL cho toi khi PredictionScoringService cham diem sau khi tran ket thuc.

   Viet dang idempotent (chi tao neu CHUA co): tren SQL Server, CREATE TABLE tu commit
   ngay va khong rollback duoc trong transaction cua Flyway. Neu mot lan chay truoc
   da tao bang nhung app bi tat truoc khi Flyway ghi lai, lan sau V3 chay lai se
   khong bao "object da ton tai" nua (giong cach xu ly o V2).
   ============================================================================ */

IF OBJECT_ID('prediction', 'U') IS NULL
CREATE TABLE prediction (
    id                    BIGINT         IDENTITY(1,1) NOT NULL,
    user_id               BIGINT         NOT NULL,
    match_id              BIGINT         NOT NULL,
    predicted_home_score  INT            NOT NULL,
    predicted_away_score  INT            NOT NULL,
    points                INT            NULL,
    created_at            DATETIMEOFFSET NOT NULL,
    updated_at            DATETIMEOFFSET NOT NULL,
    CONSTRAINT PK_prediction PRIMARY KEY (id),
    CONSTRAINT UQ_prediction_user_match UNIQUE (user_id, match_id),
    CONSTRAINT FK_prediction_user FOREIGN KEY (user_id) REFERENCES app_user (id),
    CONSTRAINT FK_prediction_match FOREIGN KEY (match_id) REFERENCES match_fixture (id)
);
