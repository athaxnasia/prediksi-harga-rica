/* =========================================================
   ELEMENT
========================================================= */

const btnLogin     = document.getElementById("btn-login");
const btnRegister  = document.getElementById("btn-register");
const loginForm    = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const messageBox   = document.getElementById("message-box");

/* =========================================================
   CEK SUDAH LOGIN — redirect jika sudah
   Auth.me() → GET api/auth.php?action=me
========================================================= */

(async () => {
  const user = await Auth.me();
  if (user?.logged_in || user?.id) {
    window.location.href =
      user.role === "admin" ? "admin.html" : "index.html";
  }
})();

/* =========================================================
   TOGGLE FORM
========================================================= */

btnLogin.addEventListener("click", () => {
  btnLogin.classList.add("active");
  btnRegister.classList.remove("active");
  loginForm.classList.add("active-form");
  registerForm.classList.remove("active-form");
  messageBox.textContent = "";
});

btnRegister.addEventListener("click", () => {
  btnRegister.classList.add("active");
  btnLogin.classList.remove("active");
  registerForm.classList.add("active-form");
  loginForm.classList.remove("active-form");
  messageBox.textContent = "";
});

/* =========================================================
   LOGIN
   Auth.login() → POST api/auth.php?action=login
========================================================= */

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email    = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  if (!email || !password) {
    showMessage("Harap isi semua field", "red");
    return;
  }

  setLoadingLogin(true);

  try {
    const data = await Auth.login(email, password);

    showMessage("Login berhasil! Mengalihkan...", "green");

    setTimeout(() => {
      window.location.href =
        data.role === "admin" ? "admin.html" : "index.html";
    }, 800);

  } catch (err) {
    showMessage(err.message ?? "Login gagal", "red");
  } finally {
    setLoadingLogin(false);
  }
});

function setLoadingLogin(loading) {
  const btn = loginForm.querySelector("button[type=submit]");
  if (!btn) return;
  btn.disabled    = loading;
  btn.textContent = loading ? "Memproses..." : "Masuk";
}

/* =========================================================
   REGISTER
   Register.daftar() → POST api/register.php
========================================================= */

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nama     = document.getElementById("register-nama")?.value.trim() ?? "";
  const email    = document.getElementById("register-email").value.trim();
  const password = document.getElementById("register-password").value;
  const confirm  = document.getElementById("register-confirm").value;

  if (password !== confirm) {
    showMessage("Password tidak sama", "red");
    return;
  }

  if (password.length < 6) {
    showMessage("Password minimal 6 karakter", "red");
    return;
  }

  setLoadingRegister(true);

  try {
    await Register.daftar({ nama, email, password });

    showMessage(
      "Pendaftaran berhasil! Akun menunggu persetujuan admin.",
      "green"
    );

    registerForm.reset();

  } catch (err) {
    showMessage(err.message ?? "Pendaftaran gagal", "red");
  } finally {
    setLoadingRegister(false);
  }
});

function setLoadingRegister(loading) {
  const btn = registerForm.querySelector("button[type=submit]");
  if (!btn) return;
  btn.disabled    = loading;
  btn.textContent = loading ? "Memproses..." : "Daftar";
}

/* =========================================================
   MESSAGE HELPER
========================================================= */

function showMessage(message, color) {
  messageBox.textContent = message;
  messageBox.style.color = color;
}

/* =========================================================
   RESET PASSWORD POPUP
========================================================= */

const forgotLink       = document.getElementById("forgot-password-link");
const popupReset       = document.getElementById("popup-reset");
const closePopup       = document.getElementById("close-popup");
const btnResetPassword = document.getElementById("btn-reset-password");

forgotLink.addEventListener("click", (e) => {
  e.preventDefault();
  popupReset.classList.add("show");
});

closePopup.addEventListener("click", () => {
  popupReset.classList.remove("show");
});

btnResetPassword.addEventListener("click", () => {
  const email = document.getElementById("reset-email").value.trim();

  if (!email) {
    alert("Masukkan email terlebih dahulu");
    return;
  }

  alert(`Permintaan reset password untuk ${email} telah dikirim ke admin.`);
  popupReset.classList.remove("show");
});