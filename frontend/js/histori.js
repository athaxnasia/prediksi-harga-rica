/* =========================================
   DATA DUMMY
========================================= */

const historiData = [

  {
    tanggal:"01 Mei 2026",
    harga:"Rp 55.000",
    status:"Naik"
  },

  {
    tanggal:"02 Mei 2026",
    harga:"Rp 58.000",
    status:"Naik"
  },

  {
    tanggal:"03 Mei 2026",
    harga:"Rp 52.000",
    status:"Turun"
  },

  {
    tanggal:"04 Mei 2026",
    harga:"Rp 60.000",
    status:"Naik"
  },

  {
    tanggal:"05 Mei 2026",
    harga:"Rp 57.000",
    status:"Turun"
  }

];

/* =========================================
   TABLE
========================================= */

const tableBody =
document.getElementById("table-body");

function tampilkanTable(){

  tableBody.innerHTML = "";

  historiData.forEach((item) => {

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${item.tanggal}</td>
      <td>${item.harga}</td>
      <td class="${
        item.status === "Naik"
        ? "status-naik"
        : "status-turun"
      }">
        ${item.status}
      </td>
    `;

    tableBody.appendChild(row);

  });

}

tampilkanTable();

/* =========================================
   FILTER BUTTON
========================================= */

const btnFilter =
document.getElementById("btn-filter");

btnFilter.addEventListener("click", () => {

  alert(
    "Filter berhasil diterapkan"
  );

});