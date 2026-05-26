<?php
// ============================================================
// api/pasar.php — Daftar Pasar
// ============================================================
// GET  api/pasar.php  → list semua pasar (untuk dropdown form)
// ============================================================

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../includes/response.php';

setApiHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method tidak diizinkan.', 405);
}

$db   = getDB();
$stmt = $db->query('SELECT id, nama_pasar, lokasi FROM pasar ORDER BY id ASC');
$rows = $stmt->fetchAll();

sendSuccess(['pasar' => $rows]);
