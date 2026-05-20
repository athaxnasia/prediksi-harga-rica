/* =========================================================
   HAMBURGER MENU
========================================================= */

const btnHamburger = document.getElementById("btn-hamburger");
const navMenu = document.getElementById("nav-menu");

btnHamburger.addEventListener("click", () => {
  navMenu.classList.toggle("nav-open");

  const expanded =
    btnHamburger.getAttribute("aria-expanded") === "true";

  btnHamburger.setAttribute(
    "aria-expanded",
    !expanded
  );
});


/* =========================================================
   FOOTER YEAR
========================================================= */

const footerYear = document.getElementById("footer-year");

footerYear.textContent = new Date().getFullYear();


/* =========================================================
   BACK TO TOP BUTTON
========================================================= */

const btnBackTop = document.getElementById("btn-back-to-top");

window.addEventListener("scroll", () => {

  if(window.scrollY > 300){
    btnBackTop.hidden = false;
  }else{
    btnBackTop.hidden = true;
  }

});

btnBackTop.addEventListener("click", () => {

  window.scrollTo({
    top:0,
    behavior:"smooth"
  });

});


/* =========================================================
   SIMULASI DATA HARGA
========================================================= */

setTimeout(() => {

  // loading hilang
  document.getElementById("loading-harga").hidden = true;

  // tampilkan data
  document.getElementById("nilai-harga").hidden = false;
  document.getElementById("meta-harga").hidden = false;
  document.getElementById("badge-status-harga").hidden = false;

  // isi data
  document.getElementById("harga-hari-ini")
    .textContent = "54.000";

  document.getElementById("tanggal-harga")
    .textContent = "18 Mei 2026";

  document.getElementById("pasar-harga")
    .textContent = "Pasar Bersehati Manado";

  const badgeHarga =
    document.getElementById("badge-status-harga");

  badgeHarga.textContent = "Harga Normal";
  badgeHarga.classList.add("badge--normal");

}, 1500);


/* =========================================================
   SIMULASI DATA PREDIKSI
========================================================= */

function loadPrediksi(range){

  document.getElementById("loading-prediksi").hidden = false;
  document.getElementById("nilai-prediksi").hidden = true;

  setTimeout(() => {

    document.getElementById("loading-prediksi").hidden = true;
    document.getElementById("nilai-prediksi").hidden = false;
    document.getElementById("badge-status-prediksi").hidden = false;

    const low =
      document.getElementById("prediksi-low");

    const high =
      document.getElementById("prediksi-high");

    const badge =
      document.getElementById("badge-status-prediksi");

    if(range === "besok"){

      low.textContent = "55.000";
      high.textContent = "58.000";

      badge.textContent = "Naik Sedikit";
      badge.className =
        "badge-status badge--tinggi";

    }else{

      low.textContent = "53.000";
      high.textContent = "61.000";

      badge.textContent = "Fluktuatif";
      badge.className =
        "badge-status badge--normal";
    }

  }, 1000);

}

loadPrediksi("besok");


/* =========================================================
   TOGGLE BUTTON PREDIKSI
========================================================= */

const btnBesok =
  document.getElementById("btn-prediksi-besok");

const btnMinggu =
  document.getElementById("btn-prediksi-minggu");

btnBesok.addEventListener("click", () => {

  btnBesok.classList.add("btn-toggle--active");
  btnMinggu.classList.remove("btn-toggle--active");

  loadPrediksi("besok");

});

btnMinggu.addEventListener("click", () => {

  btnMinggu.classList.add("btn-toggle--active");
  btnBesok.classList.remove("btn-toggle--active");

  loadPrediksi("minggu");

});


/* =========================================================
   SIMULASI DATA CUACA
========================================================= */

setTimeout(() => {

  document.getElementById("loading-cuaca").hidden = true;
  document.getElementById("cuaca-grid").hidden = false;

  document.getElementById("cuaca-suhu")
    .textContent = "29";

  document.getElementById("cuaca-kelembapan")
    .textContent = "84";

  document.getElementById("cuaca-hujan")
    .textContent = "4.2";

}, 1800);