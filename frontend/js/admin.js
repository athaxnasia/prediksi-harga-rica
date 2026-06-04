/* =========================================================
   admin.js
   Requires: api.js (dimuat lebih dulu di HTML)
   <script src="js/api.js"></script>
   <script src="js/admin.js"></script>
========================================================= */

/* =========================================================
   CEK AUTH — hanya admin
   Auth.me() → GET api/auth.php?action=me
========================================================= */

(async () => {
  const user = await Auth.me();

  if (!user?.id) {
    window.location.href = "login.html";
    return;
  }

  const role = (user.role ?? "").toLowerCase();

  if (role === "penjual") {
    window.location.href = "penjual-dashboard.html";
    return;
  }

  if (role !== "admin") {
    alert("Akses ditolak. Halaman ini hanya untuk admin.");
    window.location.href = "index.html";
    return;
  }

  /* ── Isi profil dari session ── */
  const nama  = user.nama  ?? "Admin";
  const email = user.email ?? "";
  const inisial = nama.charAt(0).toUpperCase();

  document.getElementById("admin-nama").textContent   = nama;
  document.getElementById("admin-email").textContent  = email;
  document.getElementById("sidebar-nama").textContent = nama;
  document.getElementById("admin-avatar").textContent = inisial;
})();

/* =========================================================
   LOAD DAFTAR PENJUAL
   Users.getAll() → GET api/users.php
========================================================= */

async function loadPenjual() {
  try {
    const d     = await Users.getAll();
    const users = d?.users ?? d ?? [];

    /* Update summary card total penjual */
    const totalEl = document.getElementById("total-penjual");
    if (totalEl) totalEl.textContent = users.length;

    renderTablePenjual(users);

  } catch (err) {
    console.error("Gagal load penjual:", err);
    const tbody = document.getElementById("seller-table-body");
    if (tbody) {
      tbody.innerHTML =
        `<tr><td colspan="4" style="text-align:center;color:red">
          Gagal memuat data penjual
        </td></tr>`;
    }
  }
}

function renderTablePenjual(users) {
  const tbody = document.getElementById("seller-table-body");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!users || users.length === 0) {
    tbody.innerHTML =
      `<tr><td colspan="4" style="text-align:center;color:#aaa">
        Belum ada penjual terdaftar
      </td></tr>`;
    return;
  }

  users.forEach(user => {
    const row = document.createElement("tr");

    const statusCls =
      (user.status === "aktif")   ? "approved" :
      (user.status === "pending") ? "pending"  : "nonaktif";

    const approveBtn =
      user.status === "pending"
        ? `<button class="btn approve" data-id="${user.id}">Approve</button>`
        : "";

    row.innerHTML = `
      <td>${user.nama}</td>
      <td>${user.email}</td>
      <td><span class="status ${statusCls}">${user.status}</span></td>
      <td>
        ${approveBtn}
        <button class="btn delete" data-id="${user.id}">Hapus</button>
      </td>
    `;

    tbody.appendChild(row);
  });

  attachPenjualButtons();
}

function attachPenjualButtons() {
  /* APPROVE — Users.approve() */
  document.querySelectorAll("button.approve").forEach(btn => {
    btn.addEventListener("click", async () => {
      await aksiPenjual("approve", btn.dataset.id, btn);
    });
  });

  /* HAPUS — Users.hapus() */
  document.querySelectorAll("button.delete").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("Yakin ingin menghapus akun ini?")) return;
      await aksiPenjual("hapus", btn.dataset.id, btn);
    });
  });
}

async function aksiPenjual(action, userId, btn) {
  btn.disabled    = true;
  btn.textContent = "Memproses...";

  try {
    if (action === "approve") {
      await Users.approve(userId);
    } else {
      await Users.hapus(userId);
    }
    loadPenjual();

  } catch (err) {
    console.error(`Gagal ${action} penjual:`, err);
    alert(err.message ?? "Aksi gagal");
    btn.disabled    = false;
    btn.textContent = action === "approve" ? "Approve" : "Hapus";
  }
}

loadPenjual();

/* =========================================================
   LOAD PREDIKSI — isi summary card & grafik batang
   Prediksi.getMingguan() → GET api/prediksi.php
========================================================= */

async function loadPrediksiAdmin() {
  try {
    const d      = await Prediksi.getMingguan();
    const minggu = d?.prediksi_minggu ?? d?.detail ?? [];

    if (minggu.length === 0) return;

    /* Summary card prediksi hari ini (index 0 = besok, ambil terdekat) */
    const prediksiEl = document.getElementById("prediksi-hari-ini");
    if (prediksiEl) {
      const harga = Math.round(minggu[0].harga_prediksi);
      prediksiEl.textContent = `Rp ${harga.toLocaleString("id-ID")}`;
    }

    /* Render grafik batang */
    renderGrafik(minggu);

  } catch (err) {
    console.error("Gagal load prediksi:", err);
  }
}

function renderGrafik(minggu) {
  const container = document.getElementById("chart-bars");
  if (!container) return;

  const hargaArr = minggu.map(m => m.harga_prediksi);
  const maxHarga = Math.max(...hargaArr);
  const maxBarHeight = 220; /* px */

  container.innerHTML = "";

  minggu.forEach(item => {
    const tinggi = Math.round((item.harga_prediksi / maxHarga) * maxBarHeight);

    const tanggal = new Date(item.tanggal).toLocaleDateString("id-ID", {
      day: "numeric", month: "short"
    });

    const group = document.createElement("div");
    group.className = "bar-group";
    group.title     = `Rp ${Math.round(item.harga_prediksi).toLocaleString("id-ID")}`;

    group.innerHTML = `
      <div class="bar" style="height:${tinggi}px;"></div>
      <span>${tanggal}</span>
    `;

    container.appendChild(group);
  });
}

loadPrediksiAdmin();

/* =========================================================
   INPUT HARGA MANUAL
   Harga.input() → POST api/harga.php
========================================================= */

const btnSimpan     = document.getElementById("btn-simpan");
const manualMessage = document.getElementById("manual-message");

/* Load dropdown pasar
   Pasar.getAll() → GET api/pasar.php */
(async () => {
  const selectPasar = document.getElementById("pasar");
  if (!selectPasar) return;

  try {
    const d        = await Pasar.getAll();
    const pasarList = d?.pasar ?? d ?? [];

    selectPasar.innerHTML = `<option value="">-- Pilih Pasar --</option>`;

    pasarList.forEach(p => {
      const opt       = document.createElement("option");
      opt.value       = p.id;
      opt.textContent = p.nama_pasar;
      selectPasar.appendChild(opt);
    });

  } catch (err) {
    console.error("Gagal load pasar:", err);
    selectPasar.innerHTML =
      `<option value="">-- Gagal memuat pasar --</option>`;
  }
})();

if (btnSimpan) {
  btnSimpan.addEventListener("click", async () => {
    const tanggal = document.getElementById("tanggal").value;
    const harga   = document.getElementById("harga").value;
    const pasarEl = document.getElementById("pasar");
    const pasarId = pasarEl ? pasarEl.value : null;

    if (!tanggal || !harga) {
      alert("Isi semua field");
      return;
    }

    if (!pasarId) {
      alert("Pilih pasar terlebih dahulu");
      return;
    }

    btnSimpan.disabled    = true;
    btnSimpan.textContent = "Menyimpan...";

    try {
      await Harga.input({
        tanggal,
        harga:    Number(harga),
        pasar_id: Number(pasarId),
      });

      manualMessage.textContent = "✓ Harga berhasil disimpan";
      manualMessage.style.color = "#28a745";

      document.getElementById("tanggal").value = "";
      document.getElementById("harga").value   = "";
      pasarEl.value = "";

    } catch (err) {
      manualMessage.textContent = err.message ?? "Gagal menyimpan";
      manualMessage.style.color = "red";
    } finally {
      btnSimpan.disabled    = false;
      btnSimpan.textContent = "Simpan Harga";
    }
  });
}

/* =========================================================
   TOMBOL TRIGGER ML
========================================================= */

const btnML = document.getElementById("btn-ml");

if (btnML) {
  btnML.addEventListener("click", () => {
    alert(
      "Untuk memperbarui prediksi, jalankan script berikut di komputer lokal:\n\n" +
      "cd web/backend/scripts\n" +
      "python generate_prediksi.py"
    );
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