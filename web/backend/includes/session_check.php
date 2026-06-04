<?php
// ============================================================
// includes/session_check.php — Helper Cek Login & Role
// ============================================================
// Cara pakai di endpoint yang butuh autentikasi:
//
//   require_once __DIR__ . '/../includes/session_check.php';
//   requireLogin();          // cukup login, role apapun
//   requireRole('admin');    // harus admin
//   requireRole('penjual');  // harus penjual
// ============================================================

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/**
 * Pastikan user sudah login.
 * Kalau belum, langsung return 401 JSON dan hentikan eksekusi.
 */
function requireLogin(): void {
    if (empty($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Akses ditolak. Silakan login terlebih dahulu.']);
        exit;
    }
}

/**
 * Pastikan user sudah login DAN memiliki role tertentu.
 *
 * @param string $role  'admin' atau 'penjual'
 */
function requireRole(string $role): void {
    requireLogin();

    if ($_SESSION['user_role'] !== $role) {
        http_response_code(403);
        echo json_encode(['error' => 'Akses ditolak. Hak akses tidak mencukupi.']);
        exit;
    }
}

/**
 * Kembalikan data user yang sedang login.
 * Berguna agar endpoint tidak perlu baca session berulang kali.
 */
function currentUser(): array {
    return [
        'id'    => $_SESSION['user_id']   ?? null,
        'nama'  => $_SESSION['user_nama'] ?? null,
        'role'  => $_SESSION['user_role'] ?? null,
          'email' => $_SESSION['user_email'] ?? null,
    ];
}
