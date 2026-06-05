/* =========================================================
   ELEMENT
========================================================= */

const tableBody    = document.getElementById("table-body");
const btnFilter    = document.getElementById("btn-filter");
const filterBulan  = document.getElementById("filter-bulan");

/* Set default pilihan bulan ke bulan saat ini */
filterBulan.value = new Date().getMonth() + 1;

/* =========================================================
   LOAD HISTORI PER BULAN
   Histori.getByBulan(bulan, tahun) → GET api/histori.php?bulan=&tahun=
   Fallback: Histori.get(range) jika API bulan belum tersedia
========================================================= */

let currentBulan = new Date().getMonth() + 1;
let currentTahun = new Date().getFullYear();

async function loadHistori(bulan = currentBulan, tahun = currentTahun) {
  currentBulan = bulan;

  tableBody.innerHTML =
    `<tr><td colspan="3" style="text-align:center">Memuat data...</td></tr>`;

  try {
    let data = [];

    /* Coba fetch per bulan dulu */
    try {
      const d = await Histori.getByBulan(bulan, tahun);
      data = d?.histori ?? d ?? [];
    } catch (_) {
      /* Fallback: ambil 90 hari lalu filter di frontend */
      const d = await Histori.get(90);
      const semua = d?.histori ?? d ?? [];
      data = semua.filter(item => {
        const tgl = new Date(item.tanggal);
        return tgl.getMonth() + 1 === bulan && tgl.getFullYear() === tahun;
      });
    }

    tampilkanTable(data);
    updateSummaryCards(data);

  } catch (err) {
    console.error("Gagal load histori:", err);
    tableBody.innerHTML =
      `<tr><td colspan="3" style="text-align:center;color:red">
        Gagal memuat data histori
      </td></tr>`;
  }
}

/* =========================================================
   RENDER TABLE
========================================================= */

function tampilkanTable(data) {
  tableBody.innerHTML = "";

  if (!data || data.length === 0) {
    tableBody.innerHTML =
      `<tr><td colspan="3" style="text-align:center">
        Belum ada data histori
      </td></tr>`;
    return;
  }

  data.forEach((item, idx) => {
    const row = document.createElement("tr");

    /* Hitung status Naik/Turun dari item sebelumnya */
    let status    = "—";
    let statusCls = "";

    if (idx < data.length - 1) {
      const sekarang   = Number(item.harga ?? item.rata_rata ?? 0);
      const sebelumnya = Number(
        data[idx + 1].harga ?? data[idx + 1].rata_rata ?? 0
      );

      if (sekarang > sebelumnya) {
        status    = "Naik";
        statusCls = "status-naik";
      } else if (sekarang < sebelumnya) {
        status    = "Turun";
        statusCls = "status-turun";
      } else {
        status    = "Stabil";
        statusCls = "status-normal";
      }
    }

    const tanggal = new Date(item.tanggal).toLocaleDateString("id-ID", {
      day: "2-digit", month: "long", year: "numeric"
    });

    const hargaFmt = Number(item.harga ?? item.rata_rata ?? 0)
      .toLocaleString("id-ID");

    row.innerHTML = `
      <td>${tanggal}</td>
      <td>Rp ${hargaFmt}</td>
      <td class="${statusCls}">${status}</td>
    `;

    tableBody.appendChild(row);
  });
}

/* =========================================================
   UPDATE CARD SUMMARY
   Mengisi: Harga Tertinggi, Terendah, Rata-rata
========================================================= */

function updateSummaryCards(data) {
  const hargaArr = data
    .map(d => Number(d.harga ?? d.rata_rata ?? 0))
    .filter(h => h > 0);

  if (hargaArr.length === 0) return;

  const tertinggi = Math.max(...hargaArr);
  const terendah  = Math.min(...hargaArr);
  const rata      = hargaArr.reduce((a, b) => a + b, 0) / hargaArr.length;

  document.getElementById("harga-tertinggi").textContent =
    `Rp ${tertinggi.toLocaleString("id-ID")}`;
  document.getElementById("harga-terendah").textContent =
    `Rp ${terendah.toLocaleString("id-ID")}`;
  document.getElementById("harga-rata").textContent =
    `Rp ${Math.round(rata).toLocaleString("id-ID")}`;
}

/* =========================================================
   FILTER BUTTON
========================================================= */

btnFilter.addEventListener("click", () => {
  const bulan = Number(filterBulan.value);
  loadHistori(bulan, currentTahun);
});

/* =========================================================
   INIT
========================================================= */

loadHistori(currentBulan, currentTahun);

/* ── Render bar chart ── */
function renderGrafikIndex(data) {
  const container = document.getElementById("chart-bars-index");
  if (!container) return;

  /* Tampilkan 7 hari terakhir */
  const tampil   = data.slice(0, 7).reverse();
  const hargaArr = tampil.map(d => Number(d.harga ?? d.rata_rata ?? 0));
  const maxHarga = Math.max(...hargaArr);
  const maxBar   = 200; /* px */

  container.innerHTML = "";

  tampil.forEach(item => {
    const harga  = Number(item.harga ?? item.rata_rata ?? 0);
    const tinggi = maxHarga > 0 ? Math.round((harga / maxHarga) * maxBar) : 40;

    const tanggal = new Date(item.tanggal).toLocaleDateString("id-ID", {
      day: "numeric", month: "short"
    });

    const group       = document.createElement("div");
    group.className   = "bar-group";
    group.title       = `${tanggal}: Rp ${harga.toLocaleString("id-ID")}`;

    group.innerHTML = `
      <div class="bar" style="height:${tinggi}px;"></div>
      <span>${tanggal}</span>
    `;

    container.appendChild(group);
  });
}

/* ── Render stat ringkasan ── */
function renderStats(data) {
  const hargaArr = data.map(d => Number(d.harga ?? d.rata_rata ?? 0)).filter(h => h > 0);
  if (hargaArr.length === 0) return;

  const tertinggi = Math.max(...hargaArr);
  const terendah  = Math.min(...hargaArr);
  const rata      = hargaArr.reduce((a, b) => a + b, 0) / hargaArr.length;
  const pertama   = hargaArr[hargaArr.length - 1];
  const terakhir  = hargaArr[0];

  document.getElementById("stat-tertinggi").textContent =
    `Rp ${tertinggi.toLocaleString("id-ID")}`;
  document.getElementById("stat-terendah").textContent =
    `Rp ${terendah.toLocaleString("id-ID")}`;
  document.getElementById("stat-rata").textContent =
    `Rp ${Math.round(rata).toLocaleString("id-ID")}`;

  const trenEl = document.getElementById("stat-tren");
  if (terakhir > pertama) {
    trenEl.textContent = "📈 Naik";
    trenEl.style.color = "#c0392b";
  } else if (terakhir < pertama) {
    trenEl.textContent = "📉 Turun";
    trenEl.style.color = "#27ae60";
  } else {
    trenEl.textContent = "➡️ Stabil";
    trenEl.style.color = "#f4c542";
  }
}

/* =========================================================
   LOAD GRAFIK
   Histori.get(7) → GET api/histori.php?range=7
========================================================= */

async function loadGrafik() {
  document.getElementById("loading-grafik").hidden  = false;
  document.getElementById("chart-container").hidden = true;
  document.getElementById("grafik-stats").hidden    = true;

  try {
    const d    = await Histori.get(7);
    const data = d?.histori ?? d ?? [];

    if (data.length === 0) {
      document.getElementById("loading-grafik").hidden = true;
      return;
    }

    document.getElementById("loading-grafik").hidden  = true;
    document.getElementById("chart-container").hidden = false;
    document.getElementById("grafik-stats").hidden    = false;

    renderGrafikIndex(data);
    renderStats(data);

  } catch (err) {
    console.error("Gagal load grafik:", err);
    document.getElementById("loading-grafik").hidden  = true;
    document.getElementById("chart-container").hidden = false;
    document.getElementById("chart-bars-index").innerHTML =
      `<div style="width:100%;text-align:center;color:#aaa;padding:40px 0">
        Gagal memuat grafik
      </div>`;
  }
}

loadGrafik();