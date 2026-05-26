<?php
// ============================================================
// api/histori.php — Histori Harga untuk Grafik & Tabel
// ============================================================
// GET  api/histori.php            → 30 hari terakhir
// GET  api/histori.php?range=90   → 90 hari terakhir
// GET  api/histori.php?range=365  → 1 tahun terakhir
// GET  api/histori.php?penjual=1  → histori input milik penjual (login required)
// ============================================================

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../includes/response.php';
require_once __DIR__ . '/../includes/session_check.php';

setApiHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method tidak diizinkan.', 405);
}

$db = getDB();

// ── Mode: histori input milik penjual (dashboard penjual) ────
if (isset($_GET['penjual'])) {
    requireLogin();
    $user = currentUser();

    // Penjual hanya bisa lihat milik sendiri; admin bisa lihat semua
    $userId = ($user['role'] === 'admin' && isset($_GET['user_id']))
        ? (int) $_GET['user_id']
        : (int) $user['id'];

    $stmt = $db->prepare('
        SELECT
            hi.tanggal,
            hi.harga,
            p.nama_pasar,
            hi.created_at
        FROM harga_input hi
        JOIN pasar p ON p.id = hi.pasar_id
        WHERE hi.user_id = ?
        ORDER BY hi.tanggal DESC
        LIMIT 60
    ');
    $stmt->execute([$userId]);
    $rows = $stmt->fetchAll();

    sendSuccess([
        'histori_penjual' => array_map(fn($r) => [
            'tanggal'    => $r['tanggal'],
            'harga'      => (float) $r['harga'],
            'nama_pasar' => $r['nama_pasar'],
        ], $rows),
    ]);
}

// ── Mode: histori publik (rata-rata harian semua pasar) ──────
$allowedRanges = [30, 90, 365];
$range = (int) ($_GET['range'] ?? 30);
if (!in_array($range, $allowedRanges)) {
    $range = 30;
}

// Rata-rata harga harian gabungan semua pasar
$stmt = $db->prepare('
    SELECT
        hi.tanggal,
        AVG(hi.harga)   AS harga_rata,
        MIN(hi.harga)   AS harga_min,
        MAX(hi.harga)   AS harga_max
    FROM harga_input hi
    WHERE hi.tanggal >= CURDATE() - INTERVAL ? DAY
    GROUP BY hi.tanggal
    ORDER BY hi.tanggal ASC
');
$stmt->execute([$range]);
$rows = $stmt->fetchAll();

// Format untuk Chart.js: pisah labels dan values
$labels      = [];
$hargaRata   = [];
$hargaMin    = [];
$hargaMax    = [];

foreach ($rows as $r) {
    $labels[]    = $r['tanggal'];
    $hargaRata[] = round((float) $r['harga_rata'], 2);
    $hargaMin[]  = (float) $r['harga_min'];
    $hargaMax[]  = (float) $r['harga_max'];
}

// Hitung statistik ringkas
$rataKeseluruhan = count($hargaRata) > 0
    ? round(array_sum($hargaRata) / count($hargaRata), 2)
    : 0;

sendSuccess([
    'range_hari'        => $range,
    'jumlah_data'       => count($rows),
    'labels'            => $labels,
    'harga_rata'        => $hargaRata,
    'harga_min'         => $hargaMin,
    'harga_max'         => $hargaMax,
    'statistik' => [
        'rata_rata'     => $rataKeseluruhan,
        'tertinggi'     => count($hargaMax) > 0 ? max($hargaMax) : 0,
        'terendah'      => count($hargaMin) > 0 ? min($hargaMin) : 0,
    ],
]);
