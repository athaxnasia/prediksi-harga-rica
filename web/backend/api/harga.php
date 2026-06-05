<?php
// ============================================================
// api/harga.php — Harga Terkini Rica
// ============================================================
// GET  api/harga.php              → rata-rata harga hari ini
// GET  api/harga.php?pasar=1      → rata-rata per pasar
// POST api/harga.php              → input harga baru (penjual/admin)
// ============================================================

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../includes/response.php';
require_once __DIR__ . '/../includes/session_check.php';

setApiHeaders();

$db = getDB();

// ── GET: ambil harga terkini ─────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $parasarId = isset($_GET['pasar']) ? (int) $_GET['pasar'] : null;

    // Ambil harga rata-rata hari ini
    // Jika hari ini belum ada input, mundur ke hari kerja terakhir yang ada datanya
    $sql = '
        SELECT
            hi.tanggal,
            p.id            AS pasar_id,
            p.nama_pasar,
            AVG(hi.harga)   AS harga_rata,
            MIN(hi.harga)   AS harga_min,
            MAX(hi.harga)   AS harga_max,
            COUNT(*)        AS jumlah_input
        FROM harga_input hi
        JOIN pasar p ON p.id = hi.pasar_id
        WHERE hi.tanggal = (
            -- Ambil tanggal terbaru yang ada data-nya
            SELECT MAX(tanggal) FROM harga_input
        )
    ';

    $params = [];
    if ($parasarId !== null) {
        $sql .= ' AND hi.pasar_id = ?';
        $params[] = $parasarId;
    }

    $sql .= ' GROUP BY hi.tanggal, p.id, p.nama_pasar ORDER BY p.id';

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    if (empty($rows)) {
        sendSuccess([
            'harga_hari_ini'  => null,
            'per_pasar'       => [],
            'status_harga'    => null,
            'pesan'           => 'Belum ada data harga hari ini.',
        ]);
    }

    // Hitung rata-rata gabungan semua pasar
    $totalHarga = array_sum(array_column($rows, 'harga_rata'));
    $rataGabungan = round($totalHarga / count($rows), 2);

    // Status harga: bandingkan dengan rata-rata 30 hari terakhir
    $stmtAvg = $db->query('
        SELECT AVG(harga) AS rata_30hari
        FROM harga_input
        WHERE tanggal >= CURDATE() - INTERVAL 30 DAY
    ');
    $rata30 = (float) ($stmtAvg->fetch()['rata_30hari'] ?? 0);

    $statusHarga = 'Normal';
    if ($rata30 > 0) {
        $selisihPersen = (($rataGabungan - $rata30) / $rata30) * 100;
        if ($selisihPersen > 10) {
            $statusHarga = 'Tinggi';
        } elseif ($selisihPersen < -10) {
            $statusHarga = 'Rendah';
        }
    }

    // Format output per pasar
    $perPasar = array_map(fn($r) => [
        'pasar_id'      => (int) $r['pasar_id'],
        'nama_pasar'    => $r['nama_pasar'],
        'harga_rata'    => round((float) $r['harga_rata'], 2),
        'harga_min'     => (float) $r['harga_min'],
        'harga_max'     => (float) $r['harga_max'],
        'jumlah_input'  => (int) $r['jumlah_input'],
    ], $rows);

    sendSuccess([
        'tanggal'        => $rows[0]['tanggal'],
        'harga_hari_ini' => $rataGabungan,
        'per_pasar'      => $perPasar,
        'status_harga'   => $statusHarga,
        'rata_30hari'    => round($rata30, 2),
    ]);
}

// ── POST: input harga baru ───────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Harus login sebagai penjual atau admin
    requireLogin();
    $user = currentUser();

    if (!in_array($user['role'], ['penjual', 'admin'])) {
        sendError('Akses ditolak.', 403);
    }

    $pasarId  = (int) ($_POST['pasar_id'] ?? 0);
    $harga    = (float) ($_POST['harga']  ?? 0);
    $tanggal  = sanitize($_POST['tanggal'] ?? date('Y-m-d'));

    // Validasi
    if ($pasarId <= 0) {
        sendError('Pasar tidak valid.');
    }
    if ($harga <= 0) {
        sendError('Harga harus lebih dari 0.');
    }
    // Tanggal tidak boleh di masa depan
    if ($tanggal > date('Y-m-d')) {
        sendError('Tanggal tidak boleh lebih dari hari ini.');
    }
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $tanggal)) {
        sendError('Format tanggal tidak valid.');
    }

    // Cek pasar ada
    $stmtPasar = $db->prepare('SELECT id FROM pasar WHERE id = ? LIMIT 1');
    $stmtPasar->execute([$pasarId]);
    if (!$stmtPasar->fetch()) {
        sendError('Pasar tidak ditemukan.');
    }

    // Insert atau update jika sudah pernah input hari ini (admin bisa override)
    $stmt = $db->prepare('
        INSERT INTO harga_input (user_id, pasar_id, tanggal, harga)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE harga = VALUES(harga)
    ');
    $stmt->execute([$user['id'], $pasarId, $tanggal, $harga]);

    sendSuccess(
        ['message' => 'Harga berhasil disimpan.', 'tanggal' => $tanggal, 'harga' => $harga],
        201
    );
}

sendError('Method tidak diizinkan.', 405);
