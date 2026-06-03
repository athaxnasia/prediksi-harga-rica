<?php
// ============================================================
// api/users.php — Manajemen Akun Penjual (Admin Only)
// ============================================================
// GET  api/users.php                        → list semua penjual
// GET  api/users.php?status=pending         → filter by status
// POST api/users.php?action=approve         → approve penjual
// POST api/users.php?action=nonaktifkan     → nonaktifkan penjual
// POST api/users.php?action=hapus           → hapus akun penjual
// ============================================================

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../includes/response.php';
require_once __DIR__ . '/../includes/session_check.php';

setApiHeaders();
requireRole('admin');   // seluruh endpoint ini admin only

$db = getDB();

// ── GET: list semua penjual ───────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $filterStatus = sanitize($_GET['status'] ?? '');

    $sql    = 'SELECT id, nama, email, status, created_at FROM users WHERE role = ?';
    $params = ['penjual'];

    if (in_array($filterStatus, ['aktif', 'pending', 'nonaktif'])) {
        $sql    .= ' AND status = ?';
        $params[] = $filterStatus;
    }

    $sql .= ' ORDER BY
        FIELD(status, "pending", "aktif", "nonaktif"),
        created_at DESC';

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $users = $stmt->fetchAll();

    // Hitung ringkasan per status
    $stmtCount = $db->query('
        SELECT status, COUNT(*) AS total
        FROM users
        WHERE role = "penjual"
        GROUP BY status
    ');
    $counts = [];
    foreach ($stmtCount->fetchAll() as $row) {
        $counts[$row['status']] = (int) $row['total'];
    }

    sendSuccess([
        'users' => $users,
        'total'   => count($users),
        'ringkasan' => [
            'aktif'     => $counts['aktif']    ?? 0,
            'pending'   => $counts['pending']  ?? 0,
            'nonaktif'  => $counts['nonaktif'] ?? 0,
        ],
    ]);
}

// ── POST: ubah status / hapus akun ───────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action  = sanitize($_GET['action'] ?? '');
    $userId  = (int) ($_POST['user_id'] ?? 0);

    if ($userId <= 0) {
        sendError('user_id tidak valid.');
    }

    // Pastikan target adalah penjual (bukan admin lain)
    $stmtCek = $db->prepare(
        'SELECT id, role FROM users WHERE id = ? LIMIT 1'
    );
    $stmtCek->execute([$userId]);
    $targetUser = $stmtCek->fetch();

    if (!$targetUser) {
        sendError('User tidak ditemukan.', 404);
    }
    if ($targetUser['role'] !== 'penjual') {
        sendError('Hanya akun penjual yang bisa dikelola melalui endpoint ini.');
    }

    switch ($action) {
        case 'approve':
            $stmt = $db->prepare(
                'UPDATE users SET status = ? WHERE id = ?'
            );
            $stmt->execute(['aktif', $userId]);
            sendSuccess(['message' => 'Akun penjual berhasil disetujui.']);

        case 'nonaktifkan':
            $stmt = $db->prepare(
                'UPDATE users SET status = ? WHERE id = ?'
            );
            $stmt->execute(['nonaktif', $userId]);
            sendSuccess(['message' => 'Akun penjual berhasil dinonaktifkan.']);

        case 'hapus':
            // harga_input milik user akan ikut terhapus (CASCADE di schema)
            $stmt = $db->prepare('DELETE FROM users WHERE id = ?');
            $stmt->execute([$userId]);
            sendSuccess(['message' => 'Akun penjual berhasil dihapus.']);

        default:
            sendError('Action tidak dikenali. Gunakan: approve, nonaktifkan, hapus.');
    }
}

sendError('Method tidak diizinkan.', 405);
