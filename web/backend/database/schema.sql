-- ============================================================
-- RicaHolic — Skema Database MySQL
-- Aplikasi Prediksi Harga Cabai Rawit Merah Kota Manado
-- ============================================================
-- Urutan eksekusi: jalankan file ini sekali di phpMyAdmin
-- atau via terminal: mysql -u root -p ricaholic < schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS ricaholic
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE ricaholic;

-- ============================================================
-- TABEL 1: users
-- Menyimpan akun penjual dan admin.
-- Warga/tamu tidak perlu akun.
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    nama        VARCHAR(100)    NOT NULL,
    email       VARCHAR(150)    NOT NULL UNIQUE,
    password    VARCHAR(255)    NOT NULL,               -- disimpan hasil password_hash()
    role        ENUM('admin','penjual') NOT NULL DEFAULT 'penjual',
    status      ENUM('aktif','pending','nonaktif') NOT NULL DEFAULT 'pending',
    -- penjual baru masuk 'pending', admin harus approve dulu
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_email (email),
    INDEX idx_role_status (role, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABEL 2: pasar
-- Master data pasar yang terlibat.
-- Seed data: Bersehati & Pinasungkulan
-- ============================================================
CREATE TABLE IF NOT EXISTS pasar (
    id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    nama_pasar  VARCHAR(100)    NOT NULL,
    lokasi      VARCHAR(200)    DEFAULT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABEL 3: harga_input
-- Input harga harian oleh penjual (atau admin sebagai backup).
-- Satu penjual hanya boleh input sekali per pasar per hari.
-- ============================================================
CREATE TABLE IF NOT EXISTS harga_input (
    id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    user_id     INT UNSIGNED    NOT NULL,
    pasar_id    INT UNSIGNED    NOT NULL,
    tanggal     DATE            NOT NULL,
    harga       DECIMAL(10,2)   NOT NULL,               -- Rp/kg
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_penjual_pasar_hari (user_id, pasar_id, tanggal),  -- cegah duplikasi
    INDEX idx_tanggal (tanggal),
    INDEX idx_pasar_tanggal (pasar_id, tanggal),
    FOREIGN KEY (user_id)  REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (pasar_id) REFERENCES pasar(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABEL 4: prediksi
-- Diisi oleh script Python (jalankan lokal, insert ke sini).
-- PHP hanya READ dari tabel ini, tidak pernah menulis.
-- ============================================================
CREATE TABLE IF NOT EXISTS prediksi (
    id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    tanggal         DATE            NOT NULL UNIQUE,    -- satu prediksi per tanggal
    harga_prediksi  DECIMAL(10,2)   NOT NULL,           -- Rp/kg
    harga_bawah     DECIMAL(10,2)   DEFAULT NULL,       -- batas bawah interval (opsional)
    harga_atas      DECIMAL(10,2)   DEFAULT NULL,       -- batas atas interval (opsional)
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_tanggal (tanggal)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- SEED DATA
-- ============================================================

-- Admin default (password: admin123 — WAJIB diganti setelah deploy)
INSERT INTO users (nama, email, password, role, status) VALUES
(
    'Administrator',
    'admin@ricaholic.id',
    '$2y$12$eImiTXuWVxfM37uY4JANjQe5QAyEWq6Y9UXgwHp5NByZCL0VZPD7e',
    -- password_hash('admin123', PASSWORD_BCRYPT, ['cost'=>12])
    'admin',
    'aktif'
);

-- Dua pasar utama Kota Manado
INSERT INTO pasar (nama_pasar, lokasi) VALUES
    ('Pasar Bersehati',     'Jl. Bersehati, Calaca, Wenang, Manado'),
    ('Pasar Pinasungkulan', 'Jl. 17 Agustus, Bumi Beringin, Wenang, Manado');

-- ============================================================
-- CONTOH DATA PREDIKSI (opsional, untuk testing tampilan)
-- Hapus bagian ini setelah script Python sudah jalan.
-- ============================================================
INSERT INTO prediksi (tanggal, harga_prediksi, harga_bawah, harga_atas) VALUES
    (CURDATE() + INTERVAL 0 DAY, 72000.00, 68000.00, 76000.00),
    (CURDATE() + INTERVAL 1 DAY, 74500.00, 70000.00, 79000.00),
    (CURDATE() + INTERVAL 2 DAY, 73000.00, 69000.00, 77000.00),
    (CURDATE() + INTERVAL 3 DAY, 71500.00, 67000.00, 76000.00),
    (CURDATE() + INTERVAL 4 DAY, 75000.00, 70500.00, 79500.00),
    (CURDATE() + INTERVAL 5 DAY, 76500.00, 72000.00, 81000.00),
    (CURDATE() + INTERVAL 6 DAY, 74000.00, 69500.00, 78500.00);
