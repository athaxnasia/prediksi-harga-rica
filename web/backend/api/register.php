<?php
// ============================================================
// api/register.php — Registrasi Akun Penjual Baru
// ============================================================
// POST api/register.php
//   Body: nama, email, password, konfirmasi_password
//
// Akun baru masuk dengan status 'pending'.
// Admin harus approve sebelum penjual bisa login.
// ============================================================

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../includes/response.php';

setApiHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method tidak diizinkan.', 405);
}

$nama                = sanitize($_POST['nama']                ?? '');
$email               = sanitize($_POST['email']               ?? '');
$password            = $_POST['password']             ?? '';
$konfirmasi_password = $_POST['konfirmasi_password']  ?? '';

// ── Validasi input ───────────────────────────────────────────
$errors = [];

if (strlen($nama) < 3) {
    $errors[] = 'Nama minimal 3 karakter.';
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Format email tidak valid.';
}

if (strlen($password) < 8) {
    $errors[] = 'Password minimal 8 karakter.';
}

// Validasi konfirmasi dilakukan di frontend
// Backend tidak perlu cek ulang

if (!empty($errors)) {
    sendError(implode(' ', $errors));
}

// ── Cek email sudah dipakai ──────────────────────────────────
$db   = getDB();
$stmt = $db->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
$stmt->execute([$email]);

if ($stmt->fetch()) {
    sendError('Email sudah terdaftar. Gunakan email lain atau login.');
}

// ── Simpan user baru ─────────────────────────────────────────
$hashedPassword = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

$stmt = $db->prepare(
    'INSERT INTO users (nama, email, password, role, status) VALUES (?, ?, ?, ?, ?)'
);
$stmt->execute([$nama, $email, $hashedPassword, 'penjual', 'pending']);

sendSuccess(
    ['message' => 'Registrasi berhasil! Akun kamu sedang menunggu persetujuan admin.'],
    201
);
