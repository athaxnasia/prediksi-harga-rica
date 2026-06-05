/* =========================================================
   tentang.js — Halaman Tentang Kami
   Halaman statis, tidak butuh api.js
========================================================= */

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