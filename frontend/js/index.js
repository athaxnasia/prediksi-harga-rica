
/* =========================================================
   HAMBURGER MENU
========================================================= */

const btnHamburger = document.getElementById("btn-hamburger");
const navMenu      = document.getElementById("nav-menu");

btnHamburger.addEventListener("click", () => {
  navMenu.classList.toggle("nav-open");
  const expanded = btnHamburger.getAttribute("aria-expanded") === "true";
  btnHamburger.setAttribute("aria-expanded", !expanded);
});

/* =========================================================
   FOOTER YEAR
========================================================= */

document.getElementById("footer-year").textContent =
  new Date().getFullYear();

/* =========================================================
   BACK TO TOP
========================================================= */

const btnBackTop = document.getElementById("btn-back-to-top");

window.addEventListener("scroll", () => {
  btnBackTop.hidden = window.scrollY <= 300;
});

btnBackTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

/* =========================================================
   LOAD HARGA TERKINI
   Harga.getTerkini() → GET api/harga.php
========================================================= */

async function loadHarga() {
  try {
    const d = await Harga.getTerkini();

    document.getElementById("loading-harga").hidden        = true;
    document.getElementById("nilai-harga").hidden          = false;
    document.getElementById("meta-harga").hidden           = false;
    document.getElementById("badge-status-harga").hidden   = false;

    document.getElementById("harga-hari-ini").textContent =
      Number(d.harga_hari_ini ?? d.harga).toLocaleString("id-ID");

    document.getElementById("tanggal-harga").textContent =
      new Date(d.tanggal).toLocaleDateString("id-ID", {
        day: "numeric", month: "long", year: "numeric"
      });

    document.getElementById("pasar-harga").textContent =
      d.nama_pasar ?? "Pasar Bersehati Manado";

    const badge = document.getElementById("badge-status-harga");
    const harga = Number(d.harga_hari_ini ?? d.harga);

    if (harga >= 70000) {
      badge.textContent = "Harga Tinggi";
      badge.className   = "badge-status badge--tinggi";
    } else if (harga >= 50000) {
      badge.textContent = "Harga Normal";
      badge.className   = "badge-status badge--normal";
    } else {
      badge.textContent = "Harga Rendah";
      badge.className   = "badge-status badge--rendah";
    }

  } catch (err) {
    console.error("Gagal load harga:", err);
    document.getElementById("loading-harga").hidden = true;
    document.getElementById("nilai-harga").hidden   = false;
    document.getElementById("nilai-harga").textContent = "Data tidak tersedia";
  }
}

loadHarga();

/* =========================================================
   LOAD PREDIKSI
   Prediksi.getBesok()    → GET api/prediksi.php?besok=1
   Prediksi.getMingguan() → GET api/prediksi.php
========================================================= */

async function loadPrediksi(range) {
  document.getElementById("loading-prediksi").hidden       = false;
  document.getElementById("nilai-prediksi").hidden         = true;
  document.getElementById("badge-status-prediksi").hidden  = true;

  try {
    const d =
      range === "besok"
        ? await Prediksi.getBesok()
        : await Prediksi.getMingguan();

    document.getElementById("loading-prediksi").hidden      = true;
    document.getElementById("nilai-prediksi").hidden        = false;
    document.getElementById("badge-status-prediksi").hidden = false;

    const low   = document.getElementById("prediksi-low");
    const high  = document.getElementById("prediksi-high");
    const badge = document.getElementById("badge-status-prediksi");

    if (range === "besok") {
      /* getBesok() → { prediksi, tanggal, low, high, status_label, status_badge } */
      const bawah = d.harga_bawah ?? d.low  ?? d.harga_prediksi * 0.95;
      const atas  = d.harga_atas  ?? d.high ?? d.harga_prediksi * 1.05;

      low.textContent  = Math.round(bawah).toLocaleString("id-ID");
      high.textContent = Math.round(atas).toLocaleString("id-ID");

      badge.textContent = d.status_label ?? "Naik Sedikit";
      badge.className   =
        `badge-status ${d.status_badge ?? "badge--tinggi"}`;

    } else {
      /* getMingguan() → { low, high, status_label, status_badge, detail[] } */
      const minggu  = d.prediksi_minggu ?? d.detail ?? [];
      const hargaArr = minggu.map(m => m.harga_prediksi);
      const minH    = d.low  ?? Math.min(...hargaArr);
      const maxH    = d.high ?? Math.max(...hargaArr);

      low.textContent  = Math.round(minH).toLocaleString("id-ID");
      high.textContent = Math.round(maxH).toLocaleString("id-ID");

      badge.textContent = d.status_label ?? "Fluktuatif";
      badge.className   =
        `badge-status ${d.status_badge ?? "badge--normal"}`;
    }

  } catch (err) {
    console.error("Gagal load prediksi:", err);
    document.getElementById("loading-prediksi").hidden = true;
    document.getElementById("nilai-prediksi").hidden   = false;
    document.getElementById("nilai-prediksi").textContent =
      "Prediksi tidak tersedia";
  }
}

loadPrediksi("besok");

/* =========================================================
   TOGGLE BUTTON PREDIKSI
========================================================= */

const btnBesok  = document.getElementById("btn-prediksi-besok");
const btnMinggu = document.getElementById("btn-prediksi-minggu");

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
   LOAD CUACA
   Open-Meteo API — tidak butuh API key
   Koordinat: Manado
========================================================= */

async function loadCuaca() {
  try {
    const url =
      "https://api.open-meteo.com/v1/forecast" +
      "?latitude=1.4748&longitude=124.8421" +
      "&current=temperature_2m,relative_humidity_2m,precipitation" +
      "&timezone=Asia%2FMakassar";

    const res  = await fetch(url);
    const json = await res.json();
    const c    = json.current;

    document.getElementById("loading-cuaca").hidden = true;
    document.getElementById("cuaca-grid").hidden    = false;

    document.getElementById("cuaca-suhu").textContent =
      Math.round(c.temperature_2m);

    document.getElementById("cuaca-kelembapan").textContent =
      c.relative_humidity_2m;

    document.getElementById("cuaca-hujan").textContent =
      c.precipitation.toFixed(1);

  } catch (err) {
    console.error("Gagal load cuaca:", err);
    document.getElementById("loading-cuaca").hidden = true;
    document.getElementById("cuaca-grid").hidden    = false;

    document.getElementById("cuaca-suhu").textContent       = "--";
    document.getElementById("cuaca-kelembapan").textContent = "--";
    document.getElementById("cuaca-hujan").textContent      = "--";
  }
}

loadCuaca();