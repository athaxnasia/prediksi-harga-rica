/* =========================================================
   penjual.js
   Requires: api.js (dimuat lebih dulu di HTML)
   <script src="js/api.js"></script>
   <script src="js/penjual.js"></script>
========================================================= */

/* =========================================================
   CEK AUTH — hanya penjual
   Auth.me() → GET api/auth.php?action=me
========================================================= */

(async () => {
  const user = await Auth.me();

  if (!user?.id) {
    window.location.href = "login.html";
    return;
  }

  const role = (user.role ?? "").toLowerCase();

  if (role === "admin") {
    window.location.href = "admin.html";
    return;
  }

  if (role !== "penjual") {
    alert("Akses ditolak. Halaman ini hanya untuk penjual.");
    window.location.href = "penjual-dashboard.html";
    return;
  }

  /* ── Isi profil dari session ── */
  const nama    = user.nama  ?? "Penjual";
  const email   = user.email ?? "";
  const inisial = nama.charAt(0).toUpperCase();

  const namaEl    = document.getElementById("penjual-nama");
  const emailEl   = document.getElementById("penjual-email");
  const sidebarEl = document.getElementById("sidebar-nama-penjual");
  const avatarEl  = document.getElementById("penjual-avatar");

  if (namaEl)    namaEl.textContent    = nama;
  if (emailEl)   emailEl.textContent   = email;
  if (sidebarEl) sidebarEl.textContent = nama;
  if (avatarEl)  avatarEl.textContent  = inisial;
})();

/* =========================================================
   ELEMENT
========================================================= */

const btnSubmit  = document.getElementById("btn-submit");
const tableBody  = document.getElementById("table-body");
const messageBox = document.getElementById("message-box");

/* =========================================================
   LOAD DAFTAR PASAR — isi dropdown
   Pasar.getAll() → GET api/pasar.php
========================================================= */

async function loadPasar() {
  const select = document.getElementById("pasar-input");
  if (!select) return;

  try {
    const d        = await Pasar.getAll();
    const pasarList = d?.pasar ?? d ?? [];

    select.innerHTML = `<option value="">-- Pilih Pasar --</option>`;

    pasarList.forEach(p => {
      const opt       = document.createElement("option");
      opt.value       = p.id;
      opt.textContent = p.nama_pasar;
      select.appendChild(opt);
    });

  } catch (err) {
    console.error("Gagal load pasar:", err);
  }
}

loadPasar();

/* =========================================================
   LOAD GRAFIK TREN HARGA
   Histori.get(30) → GET api/histori.php?range=30
========================================================= */

async function loadGrafik() {
  const container = document.getElementById("chart-bars");
  if (!container) return;

  try {
    const d    = await Histori.get(30);
    const data = d?.histori ?? d ?? [];

    if (data.length === 0) {
      container.innerHTML =
        `<div style="width:100%;text-align:center;color:#aaa;padding:40px 0">
          Belum ada data histori
        </div>`;
      return;
    }

    /* Ambil 7 data terakhir untuk grafik */
    const tujuh = data.slice(0, 7).reverse();

    renderGrafik(tujuh);
    updateTrenMinggu(tujuh);

  } catch (err) {
    console.error("Gagal load grafik:", err);
    if (container) {
      container.innerHTML =
        `<div style="width:100%;text-align:center;color:#aaa;padding:40px 0">
          Gagal memuat grafik
        </div>`;
    }
  }
}

function renderGrafik(data) {
  const container = document.getElementById("chart-bars");
  if (!container) return;

  const hargaArr    = data.map(d => Number(d.harga ?? d.rata_rata ?? 0));
  const maxHarga    = Math.max(...hargaArr);
  const maxBarHeight = 220; /* px */

  container.innerHTML = "";

  data.forEach(item => {
    const harga  = Number(item.harga ?? item.rata_rata ?? 0);
    const tinggi = maxHarga > 0
      ? Math.round((harga / maxHarga) * maxBarHeight)
      : 40;

    const tanggal = new Date(item.tanggal).toLocaleDateString("id-ID", {
      day: "numeric", month: "short"
    });

    const group   = document.createElement("div");
    group.className = "bar-group";
    group.title   = `Rp ${harga.toLocaleString("id-ID")}`;

    group.innerHTML = `
      <div class="bar" style="height:${tinggi}px;"></div>
      <span>${tanggal}</span>
    `;

    container.appendChild(group);
  });
}

function updateTrenMinggu(data) {
  const trendEl = document.getElementById("tren-minggu");
  if (!trendEl || data.length < 2) return;

  const pertama = Number(data[0].harga ?? data[0].rata_rata ?? 0);
  const terakhir = Number(data[data.length - 1].harga ?? data[data.length - 1].rata_rata ?? 0);

  if (terakhir > pertama) {
    trendEl.textContent = "📈 Naik";
    trendEl.style.color = "#c0392b";
  } else if (terakhir < pertama) {
    trendEl.textContent = "📉 Turun";
    trendEl.style.color = "#27ae60";
  } else {
    trendEl.textContent = "➡️ Stabil";
    trendEl.style.color = "#f4c542";
  }
}

loadGrafik();

/* =========================================================
   LOAD REKOMENDASI HARGA
   Prediksi.getBesok() → GET api/prediksi.php?besok=1
========================================================= */

async function loadRekomendasi() {
  const rekEl = document.getElementById("harga-rekomendasi");
  if (!rekEl) return;

  try {
    const d     = await Prediksi.getBesok();
    const bawah = d.harga_bawah ?? d.low  ?? d.harga_prediksi * 0.93;
    const atas  = d.harga_atas  ?? d.high ?? d.harga_prediksi * 1.07;

    rekEl.textContent =
      `Rp ${Math.round(bawah).toLocaleString("id-ID")} – ` +
      `Rp ${Math.round(atas).toLocaleString("id-ID")}`;

  } catch (err) {
    console.warn("Gagal load rekomendasi:", err.message);
    if (rekEl) rekEl.textContent = "Data tidak tersedia";
  }
}

loadRekomendasi();

/* =========================================================
   LOAD HISTORI INPUT PENJUAL
   Histori.getPenjual() → GET api/histori.php?penjual=1
========================================================= */

async function loadHistoriPenjual() {
  if (!tableBody) return;

  try {
    const d    = await Histori.getPenjual();
    const data = d?.histori ?? d ?? [];

    renderHistoriTable(data);

  } catch (err) {
    console.error("Gagal load histori penjual:", err);
  }
}

function renderHistoriTable(data) {
  if (!tableBody) return;
  tableBody.innerHTML = "";

  if (!data || data.length === 0) {
    tableBody.innerHTML =
      `<tr><td colspan="3" style="text-align:center;color:#aaa">
        Belum ada data input
      </td></tr>`;
    return;
  }

  data.forEach((item, idx) => {
    const row = document.createElement("tr");

    const tanggal  = new Date(item.tanggal).toLocaleDateString("id-ID", {
      day: "2-digit", month: "long", year: "numeric"
    });
    const hargaFmt = Number(item.harga).toLocaleString("id-ID");

    /* Status naik/turun */
    let status    = "—";
    let statusCls = "";

    if (idx < data.length - 1) {
      const sekarang   = Number(item.harga);
      const sebelumnya = Number(data[idx + 1].harga);
      if (sekarang > sebelumnya)      { status = "Naik";   statusCls = "status-naik"; }
      else if (sekarang < sebelumnya) { status = "Turun";  statusCls = "status-turun"; }
      else                            { status = "Stabil"; statusCls = "status-normal"; }
    }

    row.innerHTML = `
      <td>${tanggal}</td>
      <td>Rp ${hargaFmt}</td>
      <td class="${statusCls}">${status}</td>
    `;

    tableBody.appendChild(row);
  });
}

loadHistoriPenjual();

/* =========================================================
   INPUT HARGA
   Harga.input() → POST api/harga.php
========================================================= */

if (btnSubmit) {
  btnSubmit.addEventListener("click", async () => {
    const tanggal = document.getElementById("tanggal-input").value;
    const harga   = document.getElementById("harga-input").value;
    const pasarEl = document.getElementById("pasar-input");
    const pasarId = pasarEl ? pasarEl.value : null;

    if (!tanggal || !harga) {
      alert("Harap isi semua field");
      return;
    }

    if (pasarEl && !pasarId) {
      alert("Pilih pasar terlebih dahulu");
      return;
    }

    btnSubmit.disabled    = true;
    btnSubmit.textContent = "Menyimpan...";

    try {
      const body = { tanggal, harga: Number(harga) };
      if (pasarId) body.pasar_id = Number(pasarId);

      await Harga.input(body);

      /* Tambah baris baru ke tabel */
      const row        = document.createElement("tr");
      const tanggalFmt = new Date(tanggal).toLocaleDateString("id-ID", {
        day: "2-digit", month: "long", year: "numeric"
      });

      row.innerHTML = `
        <td>${tanggalFmt}</td>
        <td>Rp ${Number(harga).toLocaleString("id-ID")}</td>
        <td class="status-normal">Baru</td>
      `;

      if (tableBody) tableBody.prepend(row);

      messageBox.textContent = "✓ Harga berhasil disimpan";
      messageBox.style.color = "#1e8449";

      document.getElementById("tanggal-input").value = "";
      document.getElementById("harga-input").value   = "";
      if (pasarEl) pasarEl.value = "";

      /* Refresh grafik setelah input baru */
      loadGrafik();

    } catch (err) {
      console.error("Gagal simpan harga:", err);
      messageBox.textContent = err.message ?? "Gagal menyimpan harga";
      messageBox.style.color = "red";
    } finally {
      btnSubmit.disabled    = false;
      btnSubmit.textContent = "Simpan Harga";
    }
  });
}

/* =========================================================
   LOGOUT
   Auth.logout() → POST api/auth.php?action=logout
========================================================= */

const btnLogout = document.getElementById("btn-logout");

if (btnLogout) {
  btnLogout.addEventListener("click", async () => {
    try {
      await Auth.logout();
    } finally {
      window.location.href = "login.html";
    }
  });
}