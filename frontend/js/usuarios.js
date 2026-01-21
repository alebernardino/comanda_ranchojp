// Variaveis de elementos DOM de Usuarios
let sectionUsuarios, navUsuarios, tabelaUsuariosBody, formUsuarios, usuarioNome, usuarioSenha, usuarioPerfil, usuarioAviso;

function carregarElementosUsuarios() {
    sectionUsuarios = document.getElementById("sectionUsuarios");
    navUsuarios = document.getElementById("navUsuarios");
    tabelaUsuariosBody = document.getElementById("tabelaUsuariosBody");
    formUsuarios = document.getElementById("formUsuarios");
    usuarioNome = document.getElementById("usuarioNome");
    usuarioSenha = document.getElementById("usuarioSenha");
    usuarioPerfil = document.getElementById("usuarioPerfil");
    usuarioAviso = document.getElementById("usuarioAviso");
}

async function carregarUsuarios() {
    if (!tabelaUsuariosBody) return;
    try {
        const usuarios = await getUsuarios();
        tabelaUsuariosBody.innerHTML = "";
        usuarios.forEach(u => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td style="padding: 12px; text-align: left;">${u.username}</td>
                <td style="padding: 12px; text-align: center;">${u.perfil}</td>
                <td style="padding: 12px; text-align: center;">${u.ativo ? "Ativo" : "Inativo"}</td>
                <td style="padding: 12px; text-align: center;">
                    <button class="btn-remover-mini" onclick="alternarStatusUsuario(${u.id}, ${u.ativo ? "false" : "true"})">
                        ${u.ativo ? "×" : "✓"}
                    </button>
                </td>
            `;
            tabelaUsuariosBody.appendChild(tr);
        });
    } catch (err) {
        console.error(err);
        if (tabelaUsuariosBody) {
            tabelaUsuariosBody.innerHTML = `<tr><td colspan="4" style="padding: 12px; text-align: center;">Acesso negado</td></tr>`;
        }
    }
}

async function alternarStatusUsuario(id, ativo) {
    try {
        await updateUsuarioStatus(id, ativo);
        await carregarUsuarios();
    } catch (err) {
        console.error(err);
        alert(err.message || "Erro ao atualizar usuário");
    }
}

async function salvarUsuario(e) {
    e.preventDefault();
    const username = usuarioNome ? usuarioNome.value.trim() : "";
    const senha = usuarioSenha ? usuarioSenha.value : "";
    const perfil = usuarioPerfil ? usuarioPerfil.value : "operador";
    if (!username || !senha) return alert("Informe usuário e senha.");

    try {
        await createUsuario({ username, senha, perfil });
        if (usuarioNome) usuarioNome.value = "";
        if (usuarioSenha) usuarioSenha.value = "";
        if (usuarioPerfil) usuarioPerfil.value = "operador";
        await carregarUsuarios();
    } catch (err) {
        console.error(err);
        alert(err.message || "Erro ao criar usuário");
    }
}

function alternarParaUsuarios() {
    document.getElementById("sectionComandas").classList.add("hidden");
    document.getElementById("sectionProdutos").classList.add("hidden");
    if (document.getElementById("sectionClientes")) document.getElementById("sectionClientes").classList.add("hidden");
    if (document.getElementById("sectionEstoque")) document.getElementById("sectionEstoque").classList.add("hidden");
    if (document.getElementById("sectionColaboradores")) document.getElementById("sectionColaboradores").classList.add("hidden");
    if (document.getElementById("sectionFinanceiro")) document.getElementById("sectionFinanceiro").classList.add("hidden");
    if (document.getElementById("sectionRelatorios")) document.getElementById("sectionRelatorios").classList.add("hidden");
    if (document.getElementById("sectionFluxoCaixa")) document.getElementById("sectionFluxoCaixa").classList.add("hidden");
    if (document.getElementById("sectionFechamento")) document.getElementById("sectionFechamento").classList.add("hidden");
    if (document.getElementById("sectionConfiguracao")) document.getElementById("sectionConfiguracao").classList.add("hidden");
    if (sectionUsuarios) sectionUsuarios.classList.remove("hidden");

    document.getElementById("navDashboard").classList.remove("active");
    document.getElementById("navProdutosSessao").classList.remove("active");
    if (document.getElementById("navClientes")) document.getElementById("navClientes").classList.remove("active");
    if (document.getElementById("navEstoque")) document.getElementById("navEstoque").classList.remove("active");
    if (document.getElementById("navColaboradores")) document.getElementById("navColaboradores").classList.remove("active");
    if (document.getElementById("navFinanceiro")) document.getElementById("navFinanceiro").classList.remove("active");
    if (document.getElementById("navRelatorios")) document.getElementById("navRelatorios").classList.remove("active");
    if (document.getElementById("navFechamento")) document.getElementById("navFechamento").classList.remove("active");
    if (document.getElementById("navConfiguracao")) document.getElementById("navConfiguracao").classList.remove("active");
    if (navUsuarios) navUsuarios.classList.add("active");

    const user = window.currentUser;
    const isAdmin = user && user.perfil === "admin";
    if (usuarioAviso) {
        usuarioAviso.textContent = isAdmin ? "" : "Somente administradores podem criar usuários.";
    }
    if (formUsuarios) formUsuarios.style.display = isAdmin ? "" : "none";

    carregarUsuarios();
}

function setupUsuariosListeners() {
    carregarElementosUsuarios();
    if (navUsuarios) navUsuarios.onclick = (e) => { e.preventDefault(); alternarParaUsuarios(); };
    if (formUsuarios) formUsuarios.addEventListener("submit", salvarUsuario);
}

document.addEventListener("DOMContentLoaded", setupUsuariosListeners);

window.setupUsuariosListeners = setupUsuariosListeners;
window.alternarParaUsuarios = alternarParaUsuarios;
window.alternarStatusUsuario = alternarStatusUsuario;
