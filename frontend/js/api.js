

const API_BASE = "../backend/api";



async function apiRequest(endpoint, options = {}) {

  const url = `${API_BASE}/${endpoint}`;

  const defaultOptions = {
    headers: { "Content-Type": "application/json" },
  };

  const mergedOptions = { ...defaultOptions, ...options };

  // Jika body bukan string (raw), stringify otomatis
  if (
    mergedOptions.body &&
    typeof mergedOptions.body !== "string"
  ) {
    mergedOptions.body = JSON.stringify(mergedOptions.body);
  }

  const res  = await fetch(url, mergedOptions);
  const json = await res.json();

  if (json.status !== "ok") {
    const msg = json.error || json.message || "Terjadi kesalahan";
    throw new Error(msg);
  }

  return json.data;

}

/* =============================================================
   AUTH
   ============================================================= */

const Auth = {

  /**
   * Login
   * POST api/auth.php?action=login
   * @param {string} email
   * @param {string} password
   * @returns {{ role: string, nama: string, ... }}
   */
  login(email, password) {
    return apiRequest("auth.php?action=login", {
      method: "POST",
      body  : { email, password },
    });
  },

  /**
   * Logout
   * POST api/auth.php?action=logout
   */
  logout() {
    return apiRequest("auth.php?action=logout", {
      method: "POST",
    });
  },

  /**
   * Cek status login & ambil data user aktif
   * GET api/auth.php?action=me
   * @returns {{ id, nama, email, role } | null}
   */
  async me() {
    try {
      return await apiRequest("auth.php?action=me");
    } catch {
      return null;  // belum login
    }
  },

};

/* =============================================================
   REGISTER
   ============================================================= */

const Register = {

  /**
   * Daftar akun penjual baru
   * POST api/register.php
   * @param {{ nama, email, password }} data
   */
  daftar(data) {
    return apiRequest("register.php", {
      method: "POST",
      body  : data,
    });
  },

};

/* =============================================================
   HARGA
   ============================================================= */

const Harga = {

  /**
   * Harga terkini hari ini (publik)
   * GET api/harga.php
   * @returns {{ tanggal, harga_hari_ini, status_harga, per_pasar[], rata_30hari }}
   */
  getTerkini() {
    return apiRequest("harga.php");
  },

  /**
   * Harga terkini per pasar tertentu (publik)
   * GET api/harga.php?pasar=<id>
   */
  getTerkiniByPasar(pasarId) {
    return apiRequest(`harga.php?pasar=${pasarId}`);
  },

  /**
   * Input harga harian (Penjual / Admin)
   * POST api/harga.php
   * @param {{ tanggal, harga, pasar_id }} data
   */
  input(data) {
    return apiRequest("harga.php", {
      method: "POST",
      body  : data,
    });
  },

};

/* =============================================================
   PREDIKSI
   ============================================================= */

const Prediksi = {

  /**
   * Prediksi 7 hari ke depan
   * GET api/prediksi.php
   * @returns {{ low, high, status_label, status_badge, detail[] }}
   */
  getMingguan() {
    return apiRequest("prediksi.php");
  },

  /**
   * Prediksi besok — untuk gamifikasi
   * GET api/prediksi.php?besok=1
   * @returns {{ prediksi, tanggal, low, high, status_label, status_badge }}
   */
  getBesok() {
    return apiRequest("prediksi.php?besok=1");
  },

};

/* =============================================================
   HISTORI
   ============================================================= */

const Histori = {

  /**
   * Histori harga publik
   * GET api/histori.php?range=<30|90|365>
   * @param {number} range  hari (default 30)
   * @returns {{ data: [{ tanggal, harga, status }] }}
   */
  get(range = 30) {
    return apiRequest(`histori.php?range=${range}`);
  },

  /**
   * Histori input milik penjual yang sedang login
   * GET api/histori.php?penjual=1
   */
  getPenjual() {
    return apiRequest("histori.php?penjual=1");
  },

};

/* =============================================================
   PASAR
   ============================================================= */

const Pasar = {

  /**
   * Daftar semua pasar (publik)
   * GET api/pasar.php
   * @returns {[{ id, nama }]}
   */
  getAll() {
    return apiRequest("pasar.php");
  },

};

/* =============================================================
   USERS  (Admin only)
   ============================================================= */

const Users = {

  /**
   * List semua penjual
   * GET api/users.php
   * @returns {[{ id, nama, email, status }]}
   */
  getAll() {
    return apiRequest("users.php");
  },

  /**
   * Approve penjual
   * POST api/users.php?action=approve
   * @param {number|string} id
   */
  approve(id) {
    return apiRequest("users.php?action=approve", {
      method: "POST",
      body  : { id },
    });
  },

  /**
   * Nonaktifkan penjual
   * POST api/users.php?action=nonaktifkan
   * @param {number|string} id
   */
  nonaktifkan(id) {
    return apiRequest("users.php?action=nonaktifkan", {
      method: "POST",
      body  : { id },
    });
  },

  /**
   * Hapus akun penjual
   * POST api/users.php?action=hapus
   * @param {number|string} id
   */
  hapus(id) {
    return apiRequest("users.php?action=hapus", {
      method: "POST",
      body  : { id },
    });
  },

};

/* =============================================================
   GAMIFIKASI  (opsional)
   ============================================================= */

const Gamifikasi = {

  /**
   * Leaderboard
   * GET api/gamifikasi.php
   * @returns {[{ nama, total_point, streak, rank }]}
   */
  getLeaderboard() {
    return apiRequest("gamifikasi.php");
  },

  /**
   * Simpan skor tebakan
   * POST api/gamifikasi.php
   * @param {{ tebakan, prediksi, selisih, skor, tanggal }} data
   * @returns {{ total_point, streak }}
   */
  simpanSkor(data) {
    return apiRequest("gamifikasi.php", {
      method: "POST",
      body  : data,
    });
  },

};