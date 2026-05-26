<?php
// ============================================================
// config/db.php — Koneksi PDO ke MySQL
// ============================================================
// Ganti nilai di bawah sesuai konfigurasi hosting kamu.
// JANGAN commit file ini ke GitHub dengan kredensial asli —
// gunakan .env atau config terpisah yang di-.gitignore.
// ============================================================

define('DB_HOST', 'localhost');
define('DB_NAME', 'ricaholic');
define('DB_USER', 'root');        // ganti sesuai user MySQL hosting
define('DB_PASS', '');            // ganti sesuai password MySQL hosting
define('DB_CHARSET', 'utf8mb4');

function getDB(): PDO {
    static $pdo = null;

    if ($pdo === null) {
        $dsn = sprintf(
            'mysql:host=%s;dbname=%s;charset=%s',
            DB_HOST, DB_NAME, DB_CHARSET
        );

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,   // keamanan: prepared statements asli
        ];

        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            // Jangan expose detail error ke client di production
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Koneksi database gagal.']);
            exit;
        }
    }

    return $pdo;
}
