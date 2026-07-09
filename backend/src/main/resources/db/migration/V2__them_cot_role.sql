/* ============================================================================
   V2 - Them cot 'role' vao app_user (phan loai nguoi dung: USER / ADMIN)

   Cac user da co se mac dinh la 'USER' (nho DEFAULT constraint).
   Flyway tu chay file nay tren cac DB dang o version 1.

   Viet dang idempotent (chi them neu cot CHUA co): tren SQL Server, lenh DDL
   tu commit ngay va khong rollback duoc trong transaction cua Flyway. Neu mot lan
   chay truoc da them cot nhung app bi tat truoc khi Flyway ghi lai, thi lan sau
   V2 chay lai se khong bao "cot da ton tai" nua.
   ============================================================================ */

IF COL_LENGTH('app_user', 'role') IS NULL
    EXEC('ALTER TABLE app_user ADD role VARCHAR(20) NOT NULL CONSTRAINT DF_app_user_role DEFAULT ''USER''');
