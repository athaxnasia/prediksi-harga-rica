<?php
// ============================================================
// api/auth.php — Login & Logout
// ============================================================
// POST api/auth.php?action=login   → login user
// POST api/auth.php?action=logout  → logout user
// GET  api/auth.php?action=me      → cek status login saat ini
// ============================================================

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../includes/response.php';
require_once __DIR__ . '/../includes/session_check.php';

setApiHeaders();

$action = $_GET['action'] ?? '';

// ── GET: cek siapa yang sedang login ────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'me') {
    if (!empty($_SESSION['user_id'])) {
        sendSuccess([
            'logged_in' => true,
            'id'        => $_SESSION['user_id'],
            'nama'      => $_SESSION['user_nama'],
            'role'      => $_SESSION['user_role'],
        ]);
    }
    sendSuccess(['logged_in' => false]);
}

// ── POST: login ─────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'login') {
    $email    = sanitize($_POST['email']    ?? '');
    $password = $_POST['password'] ?? '';   // tidak di-sanitize, langsung ke password_verify

    if ($email === '' || $password === '') {
        sendError('Email dan password wajib diisi.');
    }

    $db   = getDB();
    $stmt = $db->prepare(
        'SELECT id, nama, email, password, role, status FROM users WHERE email = ? LIMIT 1'
    );
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    // Pesan error sengaja dibuat generik agar tidak bocorkan info akun
    if (!$user || !password_verify($password, $user['password'])) {
        sendError('Email atau password salah.', 401);
    }

    if ($user['status'] === 'pending') {
        sendError('Akun kamu belum disetujui oleh admin. Silakan tunggu konfirmasi.', 403);
    }

    if ($user['status'] === 'nonaktif') {
        sendError('Akun kamu telah dinonaktifkan. Hubungi admin untuk informasi lebih lanjut.', 403);
    }

    // Set session
    session_regenerate_id(true);    // cegah session fixation
    $_SESSION['user_id']   = $user['id'];
    $_SESSION['user_nama'] = $user['nama'];
    $_SESSION['user_role'] = $user['role'];

    sendSuccess([
        'id'   => $user['id'],
        'nama' => $user['nama'],
        'role' => $user['role'],
    ]);
}

// ── POST: logout ─────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'logout') {
    $_SESSION = [];
    session_destroy();
    sendSuccess(['message' => 'Berhasil logout.']);
}

// Jika action tidak dikenali
sendError('Endpoint tidak ditemukan.', 404);
