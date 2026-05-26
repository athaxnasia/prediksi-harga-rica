<?php
// ============================================================
// api/gamifikasi.php — Skor Tebak Harga (Opsional)
// ============================================================
// Catatan: fitur gamifikasi utama (poin & streak) disimpan di
// localStorage frontend — tidak butuh database.
//
// Endpoint ini OPSIONAL — hanya digunakan jika tim memutuskan
// untuk menyimpan skor ke database (misal untuk leaderboard).
//
// GET  api/gamifikasi.php              → leaderboard (top 10)
// POST api/gamifikasi.php              → simpan skor tebakan
// ============================================================

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../includes/response.php';

setApiHeaders();

$db = getDB();

// Pastikan tabel skor ada (buat kalau belum)
// Ini cara aman agar tidak error jika tabel belum dibuat lewat schema.sql
$db->exec('
    CREATE TABLE IF NOT EXISTS skor_gamifikasi (
        id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
        nama_pemain     VARCHAR(100)    NOT NULL,
        tebakan         DECIMAL(10,2)   NOT NULL,
        harga_aktual    DECIMAL(10,2)   NOT NULL,
        selisih         DECIMAL(10,2)   NOT NULL,
        skor            TINYINT UNSIGNED NOT NULL,       -- 0-100
        tanggal         DATE            NOT NULL,
        created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        INDEX idx_tanggal (tanggal),
        INDEX idx_skor (skor DESC)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
');

// ── GET: leaderboard top 10 ───────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $mode = sanitize($_GET['mode'] ?? 'leaderboard');

    if ($mode === 'leaderboard') {
        // Top 10 skor tertinggi sepanjang masa
        $stmt = $db->query('
            SELECT nama_pemain, skor, selisih, tanggal
            FROM skor_gamifikasi
            ORDER BY skor DESC, selisih ASC, created_at ASC
            LIMIT 10
        ');
        sendSuccess(['leaderboard' => $stmt->fetchAll()]);
    }

    if ($mode === 'hari_ini') {
        // Skor hari ini
        $stmt = $db->query('
            SELECT nama_pemain, skor, selisih
            FROM skor_gamifikasi
            WHERE tanggal = CURDATE()
            ORDER BY skor DESC
            LIMIT 10
        ');
        sendSuccess(['hari_ini' => $stmt->fetchAll()]);
    }

    sendError('Mode tidak dikenali.', 400);
}

// ── POST: simpan skor tebakan ─────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $namaPemain  = sanitize($_POST['nama_pemain']  ?? 'Anonim');
    $tebakan     = (float) ($_POST['tebakan']      ?? 0);
    $hargaAktual = (float) ($_POST['harga_aktual'] ?? 0);

    if ($tebakan <= 0 || $hargaAktual <= 0) {
        sendError('Data tebakan tidak valid.');
    }

    if (strlen($namaPemain) < 2) {
        $namaPemain = 'Anonim';
    }

    // Hitung selisih dan skor (0-100)
    // Skor = 100 dikurangi persentase error, minimum 0
    $selisih        = abs($tebakan - $hargaAktual);
    $persenError    = ($hargaAktual > 0) ? ($selisih / $hargaAktual) * 100 : 100;
    $skor           = (int) max(0, round(100 - ($persenError * 5)));
    // *5 agar setiap 1% error = -5 poin (error 20% = skor 0)

    $stmt = $db->prepare('
        INSERT INTO skor_gamifikasi
            (nama_pemain, tebakan, harga_aktual, selisih, skor, tanggal)
        VALUES (?, ?, ?, ?, ?, CURDATE())
    ');
    $stmt->execute([$namaPemain, $tebakan, $hargaAktual, $selisih, $skor]);

    sendSuccess([
        'skor'          => $skor,
        'selisih'       => $selisih,
        'pesan'         => $skor >= 80
            ? 'Tebakan kamu sangat akurat! 🌶️'
            : ($skor >= 50 ? 'Lumayan! Terus latihan ya.' : 'Jauh banget nih, coba lagi besok!'),
    ], 201);
}

sendError('Method tidak diizinkan.', 405);
