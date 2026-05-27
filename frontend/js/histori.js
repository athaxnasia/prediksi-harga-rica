
/* =========================================================
   ELEMENT
========================================================= */

const tableBody = document.getElementById("table-body");
const btnFilter = document.getElementById("btn-filter");

/* =========================================================
   LOAD HISTORI
   Histori.get(range) → GET api/histori.php?range=30
========================================================= */

let currentRange = 30;

async function loadHistori(range = 30) {
  currentRange = range;

  tableBody.innerHTML =
    `<tr><td colspan="3" style="text-align:center">Memuat data...</td></tr>`;

  try {
    const d    = await Histori.get(range);
    const data = d?.histori ?? d ?? [];

    tampilkanTable(data);

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
   FILTER BUTTON
========================================================= */

btnFilter.addEventListener("click", () => {
  const selectRange = document.getElementById("filter-range");
  const range = selectRange ? Number(selectRange.value) : currentRange;
  loadHistori(range);
});

/* =========================================================
   INIT
========================================================= */

loadHistori(30);