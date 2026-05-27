/* =========================================================
   FOOTER YEAR
========================================================= */

document.getElementById("footer-year").textContent =
new Date().getFullYear();

/* =========================================================
   ELEMENT
========================================================= */

const totalPointElement =
document.getElementById("player-total-point");

const streakElement =
document.getElementById("player-streak");

const formTebakan =
document.getElementById("form-tebak-harga");

const inputTebakan =
document.getElementById("input-tebakan");

const sectionHasil =
document.getElementById("section-hasil");

const hasilUser =
document.getElementById("hasil-user");

const hasilModel =
document.getElementById("hasil-model");

const hasilSelisih =
document.getElementById("hasil-selisih");

const hasilSkor =
document.getElementById("hasil-skor");

const alertPlayed =
document.getElementById("alert-already-played");

const riwayatBody =
document.getElementById("riwayat-body");

const stateRiwayatKosong =
document.getElementById("state-riwayat-kosong");

/* =========================================================
   LOCAL STORAGE
========================================================= */

let totalPoint =
Number(localStorage.getItem("rica_total_point")) || 0;

let streak =
Number(localStorage.getItem("rica_streak")) || 0;

let lastPlayed =
localStorage.getItem("rica_last_played") || "";

let riwayat =
JSON.parse(
  localStorage.getItem("rica_riwayat")
) || [];

/* =========================================================
   UPDATE UI
========================================================= */

function updateStatusUI(){

  totalPointElement.textContent =
  totalPoint;

  streakElement.textContent =
  streak;

}

updateStatusUI();

/* =========================================================
   CHECK ALREADY PLAYED
========================================================= */

const today =
new Date().toISOString().split("T")[0];

if(lastPlayed === today){

  alertPlayed.hidden = false;

  formTebakan.hidden = true;

}

/* =========================================================
   SUBMIT TEBAKAN
========================================================= */

formTebakan.addEventListener("submit", async () => {

  const tebakan =
  Number(inputTebakan.value);

  if(!tebakan || tebakan <= 0){

    alert("Masukkan angka yang valid");

    return;
  }

  /* =========================================
     SIMULASI API
     Nanti ganti fetch ke:
     api/prediksi.php
  ========================================= */

  const prediksiModel =
  57500;

  /* =========================================
     HITUNG SELISIH
  ========================================= */

  const selisih =
  Math.abs(
    tebakan - prediksiModel
  );

  /* =========================================
     HITUNG SKOR
  ========================================= */

  let skor =
  100 - Math.floor(selisih / 1000);

  if(skor < 0){
    skor = 0;
  }

  /* =========================================
     UPDATE POINT
  ========================================= */

  totalPoint += skor;

  /* =========================================
     STREAK SYSTEM
  ========================================= */

  const yesterdayDate =
  new Date();

  yesterdayDate.setDate(
    yesterdayDate.getDate() - 1
  );

  const yesterday =
  yesterdayDate.toISOString().split("T")[0];

  if(lastPlayed === yesterday){

    streak += 1;

  }else if(lastPlayed !== today){

    streak = 1;

  }

  /* =========================================
     SAVE STORAGE
  ========================================= */

  localStorage.setItem(
    "rica_total_point",
    totalPoint
  );

  localStorage.setItem(
    "rica_streak",
    streak
  );

  localStorage.setItem(
    "rica_last_played",
    today
  );

  /* =========================================
     SAVE HISTORY
  ========================================= */

  const dataHistory = {

    tanggal: today,

    tebakan: tebakan,

    prediksi: prediksiModel,

    selisih: selisih,

    skor: skor

  };

  riwayat.unshift(dataHistory);

  riwayat =
  riwayat.slice(0,5);

  localStorage.setItem(
    "rica_riwayat",
    JSON.stringify(riwayat)
  );

  /* =========================================
     UPDATE HASIL
  ========================================= */

  hasilUser.textContent =
  `Rp ${tebakan.toLocaleString("id-ID")}`;

  hasilModel.textContent =
  `Rp ${prediksiModel.toLocaleString("id-ID")}`;

  hasilSelisih.textContent =
  `Rp ${selisih.toLocaleString("id-ID")}`;

  hasilSkor.textContent =
  `${skor}/100`;

  sectionHasil.hidden = false;

  /* =========================================
     UPDATE UI
  ========================================= */

  updateStatusUI();

  renderRiwayat();

  /* =========================================
     LOCK GAME
  ========================================= */

  formTebakan.hidden = true;

  alertPlayed.hidden = false;

});

/* =========================================================
   RENDER HISTORY
========================================================= */

function renderRiwayat(){

  riwayatBody.innerHTML = "";

  if(riwayat.length === 0){

    stateRiwayatKosong.hidden = false;

    return;
  }

  stateRiwayatKosong.hidden = true;

  riwayat.forEach(item => {

    const row =
    document.createElement("tr");

    row.innerHTML = `

      <td>${item.tanggal}</td>

      <td>
        Rp ${item.tebakan.toLocaleString("id-ID")}
      </td>

      <td>
        Rp ${item.prediksi.toLocaleString("id-ID")}
      </td>

      <td>
        Rp ${item.selisih.toLocaleString("id-ID")}
      </td>

      <td>
        ${item.skor}/100
      </td>

    `;

    riwayatBody.appendChild(row);

  });

}

renderRiwayat();

/* =========================================================
   BACK TO TOP
========================================================= */

const btnBackToTop =
document.getElementById("btn-back-to-top");

window.addEventListener("scroll", () => {

  if(window.scrollY > 300){

    btnBackToTop.hidden = false;

  }else{

    btnBackToTop.hidden = true;

  }

});

btnBackToTop.addEventListener("click", () => {

  window.scrollTo({
    top:0,
    behavior:"smooth"
  });

});