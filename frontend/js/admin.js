/* =========================================================
   CEK AUTH — harus admin
   Auth.me() → GET api/auth.php?action=me
========================================================= */

(async () => {
  const user = await Auth.me();

  if (!user?.id) {
    window.location.href = "login.html";
    return;
  }

  if (user.role !== "admin") {
    alert("Akses ditolak. Halaman ini hanya untuk admin.");
    window.location.href = "index.html";
    return;
  }

  const namaEl = document.getElementById("admin-nama");
  if (namaEl) namaEl.textContent = user.nama ?? "Admin";
})();

/* =========================================================
   LOAD DAFTAR PENJUAL
   Users.getAll() → GET api/users.php
========================================================= */

async function loadPenjual() {
  try {
    const d     = await Users.getAll();
    const users = d?.users ?? d ?? [];

    renderTablePenjual(users);

  } catch (err) {
    console.error("Gagal load penjual:", err);
  }
}

function renderTablePenjual(users) {
  const tbody = document.querySelector("table tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!users || users.length === 0) {
    tbody.innerHTML =
      `<tr><td colspan="5" style="text-align:center">Belum ada penjual</td></tr>`;
    return;
  }

  users.forEach(user => {
    const row = document.createElement("tr");

    const statusCls =
      user.status === "aktif"   ? "approved" :
      user.status === "pending" ? "pending"  : "nonaktif";

    const approveBtn =
      user.status === "pending"
        ? `<button class="approve" data-id="${user.id}">Approve</button>`
        : "";

    row.innerHTML = `
      <td>${user.nama}</td>
      <td>${user.email}</td>
      <td><span class="status ${statusCls}">${user.status}</span></td>
      <td>
        ${approveBtn}
        <button class="delete" data-id="${user.id}">Hapus</button>
      </td>
    `;

    tbody.appendChild(row);
  });

  attachPenjualButtons();
}

function attachPenjualButtons() {
  /* APPROVE — Users.approve() → POST api/users.php?action=approve */
  document.querySelectorAll("button.approve").forEach(btn => {
    btn.addEventListener("click", async () => {
      await aksiPenjual("approve", btn.dataset.id, btn);
    });
  });

  /* HAPUS — Users.hapus() → POST api/users.php?action=hapus */
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
   INPUT HARGA MANUAL (admin)
   Harga.input() → POST api/harga.php
========================================================= */

const btnSimpan     = document.getElementById("btn-simpan");
const manualMessage = document.getElementById("manual-message");

if (btnSimpan) {

  /* Load pasar ke dropdown admin
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
    } catch (_) {}
  })();

  btnSimpan.addEventListener("click", async () => {
    const tanggal = document.getElementById("tanggal").value;
    const harga   = document.getElementById("harga").value;
    const pasarEl = document.getElementById("pasar");
    const pasarId = pasarEl ? pasarEl.value : null;

    if (!tanggal || !harga) {
      alert("Isi semua field");
      return;
    }

    btnSimpan.disabled    = true;
    btnSimpan.textContent = "Menyimpan...";

    try {
      const body = { tanggal, harga: Number(harga) };
      if (pasarId) body.pasar_id = Number(pasarId);

      await Harga.input(body);

      manualMessage.textContent = "Harga berhasil disimpan ✓";
      manualMessage.style.color = "green";

    } catch (err) {
      console.error("Gagal simpan harga admin:", err);
      manualMessage.textContent = err.message ?? "Gagal menyimpan";
      manualMessage.style.color = "red";
    } finally {
      btnSimpan.disabled    = false;
      btnSimpan.textContent = "Simpan";
    }
  });
}

/* =========================================================
   TOMBOL TRIGGER ML
   Hanya menampilkan instruksi — script Python dijalankan manual
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