// Módulo de autenticação
let loginScreen, loginForm, loginUsername, loginPassword, loginError;
let btnLogout;

function carregarElementosLogin() {
  loginScreen = document.getElementById("loginScreen");
  loginForm = document.getElementById("loginForm");
  loginUsername = document.getElementById("loginUsername");
  loginPassword = document.getElementById("loginPassword");
  loginError = document.getElementById("loginError");
  btnLogout = document.getElementById("btnLogout");
}

function mostrarLogin() {
  if (loginScreen) loginScreen.style.display = "flex";
  document.querySelector(".sidebar").style.display = "none";
  document.querySelector(".sidebar-right").style.display = "none";
  document.querySelector(".main-content").style.display = "none";
  if (loginUsername) loginUsername.focus();
}

function ocultarLogin() {
  if (loginScreen) loginScreen.style.display = "none";
  document.querySelector(".sidebar").style.display = "";
  document.querySelector(".sidebar-right").style.display = "";
  document.querySelector(".main-content").style.display = "";
}

async function verificarSessao() {
  try {
    const resp = await apiGet("/auth/me");
    window.currentUser = resp.usuario;
    return true;
  } catch (err) {
    return false;
  }
}

async function loginSubmit(e) {
  e.preventDefault();
  if (loginError) loginError.textContent = "";
  const username = loginUsername ? loginUsername.value.trim() : "";
  const senha = loginPassword ? loginPassword.value : "";
  if (!username || !senha) {
    if (loginError) loginError.textContent = "Informe usuário e senha.";
    return;
  }
  try {
    const resp = await apiPost("/auth/login", { username, senha });
    window.currentUser = resp.usuario;
    if (typeof window.refreshPrinterConfig === "function") {
      await window.refreshPrinterConfig();
    }
    ocultarLogin();
    await verificarVigenciaLicenca();
    if (typeof window.startApp === "function") {
      window.startApp();
    }
  } catch (err) {
    if (loginError) loginError.textContent = err.message || "Falha no login.";
  }
}

function diasRestantes(expiraEm) {
  if (!expiraEm) return null;
  const data = new Date(expiraEm);
  if (Number.isNaN(data.getTime())) return null;
  // Considera o fim do dia da expiração
  data.setHours(23, 59, 59, 999);
  const agora = new Date();
  const diffMs = data.getTime() - agora.getTime();
  const dias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(dias, 0);
}

async function verificarVigenciaLicenca() {
  try {
    const status = await apiGet("/licenca/status");
    if (!status || !status.dados) return;
    const dias = diasRestantes(status.dados.expira_em);
    if (dias !== null && dias <= 10) {
      alert(`A licença expira em ${dias} dia(s).`);
    }
  } catch (err) {
    // silencioso
  }
}

async function authBoot() {
  carregarElementosLogin();
  const ok = await verificarSessao();
  if (ok) {
    if (typeof window.refreshPrinterConfig === "function") {
      await window.refreshPrinterConfig();
    }
    ocultarLogin();
    await verificarVigenciaLicenca();
    if (typeof window.startApp === "function") {
      window.startApp();
    }
  } else {
    mostrarLogin();
    if (loginForm) loginForm.addEventListener("submit", loginSubmit);
  }
  if (btnLogout) {
    btnLogout.onclick = async () => {
      try {
        await apiPost("/auth/logout", {});
      } finally {
        window.currentUser = null;
        mostrarLogin();
      }
    };
  }
}

window.authBoot = authBoot;
