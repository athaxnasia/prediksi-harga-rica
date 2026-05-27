/* ===================================================
   ELEMENT
=================================================== */

const btnLogin =
document.getElementById("btn-login");

const btnRegister =
document.getElementById("btn-register");

const loginForm =
document.getElementById("login-form");

const registerForm =
document.getElementById("register-form");

const messageBox =
document.getElementById("message-box");

/* ===================================================
   TOGGLE FORM
=================================================== */

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

/* ===================================================
   LOGIN
=================================================== */

loginForm.addEventListener("submit", (e) => {

  e.preventDefault();

  const email =
  document.getElementById("login-email").value;

  const password =
  document.getElementById("login-password").value;

  if(email === "" || password === ""){

    showMessage(
      "Harap isi semua field",
      "red"
    );

    return;
  }

  showMessage(
    "Login berhasil!",
    "green"
  );

  /* pindah halaman setelah 1 detik 
  setTimeout(() => {
    
    window.location.href = "index.html";
    
}, 1000);
*/

});

/* ===================================================
   REGISTER
=================================================== */

registerForm.addEventListener("submit", (e) => {

  e.preventDefault();

  const password =
  document.getElementById("register-password").value;

  const confirm =
  document.getElementById("register-confirm").value;

  if(password !== confirm){

    showMessage(
      "Password tidak sama",
      "red"
    );

    return;
  }

  showMessage(
    "Pendaftaran berhasil!",
    "green"
  );

});

/* ===================================================
   MESSAGE FUNCTION
=================================================== */

function showMessage(message, color){

  messageBox.textContent = message;
  messageBox.style.color = color;

}

/* ==========================================
   RESET PASSWORD POPUP
========================================== */

const forgotLink =
document.getElementById("forgot-password-link");

const popupReset =
document.getElementById("popup-reset");

const closePopup =
document.getElementById("close-popup");

const btnResetPassword =
document.getElementById("btn-reset-password");

/* BUKA POPUP */
forgotLink.addEventListener("click", (e) => {

  e.preventDefault();

  popupReset.classList.add("show");

});

/* TUTUP POPUP */
closePopup.addEventListener("click", () => {

  popupReset.classList.remove("show");

});

/* RESET PASSWORD */
btnResetPassword.addEventListener("click", () => {

  const email =
  document.getElementById("reset-email").value;

  if(email === ""){

    alert("Masukkan email terlebih dahulu");

    return;
  }

  alert(
    "Link reset password berhasil dikirim ke " + email
  );

  popupReset.classList.remove("show");

});