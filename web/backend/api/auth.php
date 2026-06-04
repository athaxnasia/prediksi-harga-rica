<?php
// ============================================================
// api/auth.php — Login & Logout
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
             'email'     => $_SESSION['user_email'] ?? '',
        ]);
    }
    sendSuccess(['logged_in' => false]);
}

// ── POST: login ─────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'login') {
    $input    = getInput();
    $email    = sanitize($input['email']    ?? '');
    $password = $input['password'] ?? '';

    if ($email === '' || $password === '') {
        sendError('Email dan password wajib diisi.');
    }

    $db   = getDB();
    $stmt = $db->prepare(
        'SELECT id, nama, email, password, role, status FROM users WHERE email = ? LIMIT 1'
    );
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password'])) {
        sendError('Email atau password salah.', 401);
    }

    if ($user['status'] === 'pending') {
        sendError('Akun kamu belum disetujui oleh admin.', 403);
    }

    if ($user['status'] === 'nonaktif') {
        sendError('Akun kamu telah dinonaktifkan.', 403);
    }

    session_regenerate_id(true);
    $_SESSION['user_id']   = $user['id'];
    $_SESSION['user_nama'] = $user['nama'];
    $_SESSION['user_role'] = $user['role'];
    $_SESSION['user_email'] = $user['email'];

    sendSuccess([
        'id'   => $user['id'],
        'nama' => $user['nama'],
        'role' => $user['role'],
        'email' => $user['email'],
    ]);
}

// ── POST: logout ─────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'logout') {
    $_SESSION = [];
    session_destroy();
    sendSuccess(['message' => 'Berhasil logout.']);
}

sendError('Endpoint tidak ditemukan.', 404);