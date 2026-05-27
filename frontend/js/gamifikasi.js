/* =========================================================
   FOOTER YEAR
========================================================= */

document.getElementById("footer-year").textContent =
  new Date().getFullYear();

/* =========================================================
   ELEMENT
========================================================= */

const totalPointElement  = document.getElementById("player-total-point");
const streakElement      = document.getElementById("player-streak");
const formTebakan        = document.getElementById("form-tebak-harga");
const inputTebakan       = document.getElementById("input-tebakan");
const sectionHasil       = document.getElementById("section-hasil");
const hasilUser          = document.getElementById("hasil-user");
const hasilModel         = document.getElementById("hasil-model");
const hasilSelisih       = document.getElementById("hasil-selisih");
const hasilSkor          = document.getElementById("hasil-skor");
const alertPlayed        = document.getElementById("alert-already-played");
const riwayatBody        = document.getElementById("riwayat-body");
const stateRiwayatKosong = document.getElementById("state-riwayat-kosong");

/* =========================================================
   LOCAL STORAGE
========================================================= */

let totalPoint = Number(localStorage.getItem("rica_total_point")) || 0;
let streak     = Number(localStorage.getItem("rica_streak"))      || 0;
let lastPlayed = localStorage.getItem("rica_last_played")         || "";
let riwayat    = JSON.parse(localStorage.getItem("rica_riwayat")) || [];

/* =========================================================
   UPDATE UI
========================================================= */

function updateStatusUI() {
  totalPointElement.textContent = totalPoint;
  streakElement.textContent     = streak;
}

updateStatusUI();

/* =========================================================
   CEK SUDAH MAIN HARI INI
========================================================= */

const today = new Date().toISOString().split("T")[0];

if (lastPlayed === today) {
  alertPlayed.hidden = false;
  formTebakan.hidden = true;
}

/* =========================================================
   LOAD PREDIKSI BESOK — dasar penilaian tebakan
   Prediksi.getBesok() → GET api/prediksi.php?besok=1
========================================================= */

let prediksiServerBesok = null;

async function loadPrediksiUntukTebak() {
  try {
    prediksiServerBesok = await Prediksi.getBesok();
  } catch (err) {
    console.warn("Gagal ambil prediksi besok:", err.message);
    prediksiServerBesok = null;
  }
}

if (lastPlayed !== today) {
  loadPrediksiUntukTebak();
}

/* =========================================================
   SUBMIT TEBAKAN
========================================================= */

formTebakan.addEventListener("submit", async (e) => {
  e.preventDefault();

  const tebakan = Number(inputTebakan.value);

  if (!tebakan || tebakan <= 0) {
    alert("Masukkan angka yang valid");
    return;
  }

  /* Ambil nilai prediksi dari server, fallback ke nilai statis */
  const prediksiModel =
    prediksiServerBesok?.harga_prediksi ??
    prediksiServerBesok?.prediksi       ??
    57500;

  /* ── Hitung Selisih & Skor ── */
  const selisih = Math.abs(tebakan - prediksiModel);
  let   skor    = 100 - Math.floor(selisih / 1000);
  if (skor < 0) skor = 0;

  /* ── Update Point ── */
  totalPoint += skor;

  /* ── Streak System ── */
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split("T")[0];

  if (lastPlayed === yesterday) {
    streak += 1;
  } else if (lastPlayed !== today) {
    streak = 1;
  }

  /* ── Simpan ke Local Storage ── */
  localStorage.setItem("rica_total_point", totalPoint);
  localStorage.setItem("rica_streak",      streak);
  localStorage.setItem("rica_last_played", today);

  const dataHistory = { tanggal: today, tebakan, prediksi: prediksiModel, selisih, skor };
  riwayat = [dataHistory, ...riwayat].slice(0, 5);
  localStorage.setItem("rica_riwayat", JSON.stringify(riwayat));

  /* ── Kirim Skor ke Server (opsional)
     Gamifikasi.simpanSkor() → POST api/gamifikasi.php ── */
  try {
    await Gamifikasi.simpanSkor({
      tanggal:  today,
      tebakan,
      prediksi: prediksiModel,
      selisih,
      skor,
      streak,
    });
  } catch (_) {
    /* Abaikan — skor tetap tersimpan di localStorage */
  }

  /* ── Update UI Hasil ── */
  hasilUser.textContent    = `Rp ${tebakan.toLocaleString("id-ID")}`;
  hasilModel.textContent   = `Rp ${Math.round(prediksiModel).toLocaleString("id-ID")}`;
  hasilSelisih.textContent = `Rp ${selisih.toLocaleString("id-ID")}`;
  hasilSkor.textContent    = `${skor}/100`;

  sectionHasil.hidden = false;

  updateStatusUI();
  renderRiwayat();

  /* ── Kunci Form ── */
  formTebakan.hidden = true;
  alertPlayed.hidden = false;
});

/* =========================================================
   RENDER RIWAYAT
========================================================= */

function renderRiwayat() {
  riwayatBody.innerHTML = "";

  if (riwayat.length === 0) {
    stateRiwayatKosong.hidden = false;
    return;
  }

  stateRiwayatKosong.hidden = true;

  riwayat.forEach(item => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${item.tanggal}</td>
      <td>Rp ${Number(item.tebakan).toLocaleString("id-ID")}</td>
      <td>Rp ${Math.round(item.prediksi).toLocaleString("id-ID")}</td>
      <td>Rp ${Number(item.selisih).toLocaleString("id-ID")}</td>
      <td>${item.skor}/100</td>
    `;

    riwayatBody.appendChild(row);
  });
}

renderRiwayat();

/* =========================================================
   LOAD LEADERBOARD
   Gamifikasi.getLeaderboard() → GET api/gamifikasi.php
========================================================= */

async function loadLeaderboard() {
  const leaderboardEl = document.getElementById("leaderboard-body");
  if (!leaderboardEl) return;

  try {
    const d    = await Gamifikasi.getLeaderboard();
    const data = d?.leaderboard ?? d ?? [];

    leaderboardEl.innerHTML = "";

    data.forEach((item, idx) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${idx + 1}</td>
        <td>${item.nama ?? "Anonim"}</td>
        <td>${item.total_point ?? item.skor}</td>
        <td>${item.streak ?? "—"}</td>
      `;
      leaderboardEl.appendChild(row);
    });

  } catch (err) {
    console.warn("Leaderboard tidak tersedia:", err.message);
  }
}

loadLeaderboard();

/* =========================================================
   BACK TO TOP
========================================================= */

const btnBackToTop = document.getElementById("btn-back-to-top");

window.addEventListener("scroll", () => {
  btnBackToTop.hidden = window.scrollY <= 300;
});

btnBackToTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});