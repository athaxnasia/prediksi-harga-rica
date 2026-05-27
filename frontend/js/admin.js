/* =========================================
   APPROVE PENJUAL
========================================= */

const approveButtons =
document.querySelectorAll(".approve");

approveButtons.forEach(button => {

  button.addEventListener("click", () => {

    const row =
    button.closest("tr");

    const status =
    row.querySelector(".status");

    status.textContent = "Approved";

    status.classList.remove("pending");

    status.classList.add("approved");

    button.remove();

  });

});

/* =========================================
   HAPUS PENJUAL
========================================= */

const deleteButtons =
document.querySelectorAll(".delete");

deleteButtons.forEach(button => {

  button.addEventListener("click", () => {

    const row =
    button.closest("tr");

    row.remove();

  });

});

/* =========================================
   INPUT HARGA MANUAL
========================================= */

const btnSimpan =
document.getElementById("btn-simpan");

const manualMessage =
document.getElementById("manual-message");

btnSimpan.addEventListener("click", () => {

  const tanggal =
  document.getElementById("tanggal").value;

  const harga =
  document.getElementById("harga").value;

  if(tanggal === "" || harga === ""){

    alert("Isi semua field");

    return;
  }

  manualMessage.textContent =
  "Harga berhasil disimpan";

});

/* =========================================
   TRIGGER ML
========================================= */

const btnML =
document.getElementById("btn-ml");

btnML.addEventListener("click", () => {

  btnML.textContent =
  "Memproses...";

  setTimeout(() => {

    btnML.textContent =
    "Model ML Berhasil Diperbarui";

  }, 2500);

});
