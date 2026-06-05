<?php
// ============================================================
// includes/response.php — Helper Header & Response JSON
// ============================================================
// Dipanggil di AWAL setiap file api/ sebelum output apapun.
// ============================================================

/**
 * Set header standar untuk semua endpoint API.
 * Dipanggil sekali di awal setiap file api/.
 */
function setApiHeaders(): void {
    // Izinkan frontend (same-origin di production, bisa diperketat)
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');

    // Kalau frontend dan backend beda port saat development lokal, uncomment:
    // header('Access-Control-Allow-Origin: http://localhost');
    // header('Access-Control-Allow-Credentials: true');
}

/**
 * Kirim response sukses dan hentikan eksekusi.
 *
 * @param mixed $data     Data yang dikirim ke frontend
 * @param int   $code     HTTP status code (default 200)
 */
function sendSuccess(mixed $data, int $code = 200): void {
    http_response_code($code);
    echo json_encode(['status' => 'ok', 'data' => $data], JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Kirim response error dan hentikan eksekusi.
 *
 * @param string $message Pesan error yang ditampilkan ke user
 * @param int    $code    HTTP status code (default 400)
 */
function sendError(string $message, int $code = 400): void {
    http_response_code($code);
    echo json_encode(['status' => 'error', 'error' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Sanitasi input string dari user.
 * Selalu pakai ini sebelum menggunakan $_POST / $_GET di luar prepared statement.
 */
function sanitize(string $input): string {
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}
