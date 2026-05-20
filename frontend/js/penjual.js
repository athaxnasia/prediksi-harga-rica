

/* ==========================================
   INPUT HARGA
========================================== */

const btnSubmit =
document.getElementById("btn-submit");

const tableBody =
document.getElementById("table-body");

const messageBox =
document.getElementById("message-box");

btnSubmit.addEventListener("click", () => {

  const tanggal =
  document.getElementById("tanggal-input").value;

  const harga =
  document.getElementById("harga-input").value;

  if(tanggal === "" || harga === ""){

    alert(
      "Harap isi semua field"
    );

    return;
  }

  const row =
  document.createElement("tr");

  row.innerHTML = `

    <td>${tanggal}</td>

    <td>
      Rp ${Number(harga).toLocaleString("id-ID")}
    </td>

    <td class="status-normal">
      Baru
    </td>

  `;

  tableBody.prepend(row);

  messageBox.textContent =
  "Harga berhasil disimpan";

  document.getElementById("tanggal-input").value = "";
  document.getElementById("harga-input").value = "";

});