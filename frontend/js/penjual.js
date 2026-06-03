
/* =========================================================
   ELEMENT
========================================================= */

const btnSubmit  = document.getElementById("btn-submit");
const tableBody  = document.getElementById("table-body");
const messageBox = document.getElementById("message-box");

/* =========================================================
   CEK AUTH — hanya penjual yang boleh akses
   Auth.me() → GET api/auth.php?action=me
========================================================= */

(async () => {
  const user = await Auth.me();

  if (!user?.id) {
    /* Belum login → ke halaman login */
    window.location.href = "login.html";
    return;
  }

  if (user.role === "admin") {
    /* Admin salah halaman → arahkan ke admin.html */
    window.location.href = "admin.html";
    return;
  }

  if (user.role !== "penjual") {
    /* Warga atau role tidak dikenal → ke index */
    alert("Akses ditolak. Halaman ini hanya untuk penjual.");
    window.location.href = "index.html";
  }
})();

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
   LOAD HISTORI INPUT PENJUAL
   Histori.getPenjual() → GET api/histori.php?penjual=1
========================================================= */

async function loadHistoriPenjual() {
  try {
    const d    = await Histori.getPenjual();
    const data = d?.histori ?? d ?? [];

    renderHistoriTable(data);

  } catch (err) {
    console.error("Gagal load histori penjual:", err);
  }
}

function renderHistoriTable(data) {
  tableBody.innerHTML = "";

  if (!data || data.length === 0) {
    tableBody.innerHTML =
      `<tr><td colspan="3" style="text-align:center">Belum ada data</td></tr>`;
    return;
  }

  data.forEach(item => {
    const row = document.createElement("tr");

    const tanggal = new Date(item.tanggal).toLocaleDateString("id-ID", {
      day: "2-digit", month: "long", year: "numeric"
    });

    const hargaFmt = Number(item.harga).toLocaleString("id-ID");

    row.innerHTML = `
      <td>${tanggal}</td>
      <td>Rp ${hargaFmt}</td>
      <td class="status-normal">${item.nama_pasar ?? "—"}</td>
    `;

    tableBody.appendChild(row);
  });
}

loadHistoriPenjual();

/* =========================================================
   INPUT HARGA
   Harga.input() → POST api/harga.php
========================================================= */

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

    /* Tambah baris ke tabel secara optimistis */
    const row        = document.createElement("tr");
    const tanggalFmt = new Date(tanggal).toLocaleDateString("id-ID", {
      day: "2-digit", month: "long", year: "numeric"
    });

    row.innerHTML = `
      <td>${tanggalFmt}</td>
      <td>Rp ${Number(harga).toLocaleString("id-ID")}</td>
      <td class="status-normal">Baru</td>
    `;

    tableBody.prepend(row);

    messageBox.textContent = "Harga berhasil disimpan ✓";
    messageBox.style.color = "green";

    document.getElementById("tanggal-input").value = "";
    document.getElementById("harga-input").value   = "";
    if (pasarEl) pasarEl.value = "";

  } catch (err) {
    console.error("Gagal simpan harga:", err);
    alert(err.message ?? "Gagal menyimpan harga");
  } finally {
    btnSubmit.disabled    = false;
    btnSubmit.textContent = "Simpan Harga";
  }
});