<?php
// ============================================================
// api/prediksi.php — Data Prediksi Harga dari Model ML
// ============================================================
// GET  api/prediksi.php           → prediksi 7 hari ke depan
// GET  api/prediksi.php?hari=3    → prediksi N hari ke depan
// GET  api/prediksi.php?besok=1   → prediksi besok saja (untuk gamifikasi)
//
// Tabel `prediksi` hanya diisi oleh script Python, PHP hanya READ.
// ============================================================

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../includes/response.php';

setApiHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method tidak diizinkan.', 405);
}

$db = getDB();

// ── Mode: prediksi besok saja (untuk fitur gamifikasi) ───────
if (isset($_GET['besok'])) {
    $besok = date('Y-m-d', strtotime('+1 day'));

    $stmt = $db->prepare(
        'SELECT tanggal, harga_prediksi, harga_bawah, harga_atas
         FROM prediksi
         WHERE tanggal = ?
         LIMIT 1'
    );
    $stmt->execute([$besok]);
    $row = $stmt->fetch();

    if (!$row) {
        // Fallback: prediksi terdekat di masa depan
        $stmt = $db->prepare(
            'SELECT tanggal, harga_prediksi, harga_bawah, harga_atas
             FROM prediksi
             WHERE tanggal >= CURDATE()
             ORDER BY tanggal ASC
             LIMIT 1'
        );
        $stmt->execute();
        $row = $stmt->fetch();
    }

    if (!$row) {
        sendError('Data prediksi belum tersedia. Hubungi admin untuk memperbarui model.', 404);
    }

    sendSuccess([
        'tanggal'        => $row['tanggal'],
        'harga_prediksi' => (float) $row['harga_prediksi'],
        'harga_bawah'    => $row['harga_bawah'] ? (float) $row['harga_bawah'] : null,
        'harga_atas'     => $row['harga_atas']  ? (float) $row['harga_atas']  : null,
    ]);
}

// ── Mode: N hari ke depan (default 7) ────────────────────────
$hari = min((int) ($_GET['hari'] ?? 7), 30);   // maks 30 hari
if ($hari < 1) $hari = 7;

$stmt = $db->prepare('
    SELECT tanggal, harga_prediksi, harga_bawah, harga_atas
    FROM prediksi
    WHERE tanggal >= CURDATE()
    ORDER BY tanggal ASC
    LIMIT ?
');
$stmt->execute([$hari]);
$rows = $stmt->fetchAll();

if (empty($rows)) {
    sendError('Data prediksi belum tersedia. Hubungi admin untuk memperbarui model.', 404);
}

// Format output
$prediksi = array_map(fn($r) => [
    'tanggal'        => $r['tanggal'],
    'harga_prediksi' => (float) $r['harga_prediksi'],
    'harga_bawah'    => $r['harga_bawah'] ? (float) $r['harga_bawah'] : null,
    'harga_atas'     => $r['harga_atas']  ? (float) $r['harga_atas']  : null,
], $rows);

// Prediksi besok (index pertama) untuk ditampilkan menonjol di dashboard
$besok = $prediksi[0] ?? null;

sendSuccess([
    'prediksi_besok'   => $besok,
    'prediksi_minggu'  => $prediksi,
    'jumlah'           => count($prediksi),
]);
