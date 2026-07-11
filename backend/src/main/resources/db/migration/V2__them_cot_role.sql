-- V2: Them cot role vao app_user (PostgreSQL)
ALTER TABLE app_user ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'USER';
