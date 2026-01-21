// Variaveis de elementos DOM dos Clientes
let sectionClientes, navClientes, tabelaClientesBody, filtroClienteNome, filtroClienteTelefone;
let clientesCache = [];

function carregarElementosClientes() {
    sectionClientes = document.getElementById("sectionClientes");
    navClientes = document.getElementById("navClientes");
    tabelaClientesBody = document.getElementById("tabelaClientesBody");
    filtroClienteNome = document.getElementById("clienteFiltroNome");
    filtroClienteTelefone = document.getElementById("clienteFiltroTelefone");
}

function formatarDataHora(valor) {
    if (!valor) return "-";
    const data = new Date(valor.replace(" ", "T"));
    if (Number.isNaN(data.getTime())) return valor;
    return data.toLocaleString("pt-BR");
}

async function carregarClientes() {
    try {
        clientesCache = await getClientes();
        filtrarERenderizarClientes();
    } catch (err) {
        console.error(err);
        alert(err.message || "Erro ao carregar clientes");
    }
}

function filtrarERenderizarClientes() {
    if (!tabelaClientesBody) return;
    const nome = filtroClienteNome ? filtroClienteNome.value.trim().toLowerCase() : "";
    const telefone = filtroClienteTelefone ? filtroClienteTelefone.value.trim().toLowerCase() : "";

    let lista = clientesCache;
    if (nome) {
        lista = lista.filter(c => String(c.nome || "").toLowerCase().includes(nome));
    }
    if (telefone) {
        lista = lista.filter(c => String(c.telefone || "").toLowerCase().includes(telefone));
    }

    renderizarTabelaClientes(lista);
}

function renderizarTabelaClientes(lista) {
    tabelaClientesBody.innerHTML = "";
    lista.forEach(cliente => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td style="padding: 12px; text-align: left;">${cliente.nome || "-"}</td>
            <td style="padding: 12px; text-align: left;">${cliente.telefone || "-"}</td>
            <td style="padding: 12px; text-align: center;">${formatarDataHora(cliente.criado_em)}</td>
            <td style="padding: 12px; text-align: center;">${formatarDataHora(cliente.atualizado_em)}</td>
        `;
        tabelaClientesBody.appendChild(tr);
    });
}

function alternarParaClientes() {
    const section = document.getElementById("sectionClientes");
    if (!section) {
        console.error("Seção de clientes não carregada.");
        return;
    }
    sectionClientes = section;

    document.getElementById("sectionComandas").classList.add("hidden");
    document.getElementById("sectionProdutos").classList.add("hidden");
    if (document.getElementById("sectionConfiguracao")) document.getElementById("sectionConfiguracao").classList.add("hidden");
    if (document.getElementById("sectionUsuarios")) document.getElementById("sectionUsuarios").classList.add("hidden");
    if (document.getElementById("sectionColaboradores")) document.getElementById("sectionColaboradores").classList.add("hidden");
    if (document.getElementById("sectionFinanceiro")) document.getElementById("sectionFinanceiro").classList.add("hidden");
    if (document.getElementById("sectionRelatorios")) document.getElementById("sectionRelatorios").classList.add("hidden");
    if (document.getElementById("sectionFluxoCaixa")) document.getElementById("sectionFluxoCaixa").classList.add("hidden");
    if (document.getElementById("sectionFechamento")) document.getElementById("sectionFechamento").classList.add("hidden");
    sectionClientes.classList.remove("hidden");

    document.getElementById("navDashboard").classList.remove("active");
    document.getElementById("navProdutosSessao").classList.remove("active");
    if (document.getElementById("navConfiguracao")) document.getElementById("navConfiguracao").classList.remove("active");
    if (document.getElementById("navUsuarios")) document.getElementById("navUsuarios").classList.remove("active");
    if (document.getElementById("navColaboradores")) document.getElementById("navColaboradores").classList.remove("active");
    if (document.getElementById("navFinanceiro")) document.getElementById("navFinanceiro").classList.remove("active");
    if (document.getElementById("navRelatorios")) document.getElementById("navRelatorios").classList.remove("active");
    if (document.getElementById("navFechamento")) document.getElementById("navFechamento").classList.remove("active");
    navClientes = document.getElementById("navClientes");
    if (navClientes) navClientes.classList.add("active");

    carregarClientes();

    setTimeout(() => {
        if (filtroClienteTelefone) filtroClienteTelefone.focus();
    }, 100);
}

function setupClientesListeners() {
    carregarElementosClientes();

    if (navClientes) navClientes.onclick = (e) => { e.preventDefault(); alternarParaClientes(); };
    if (filtroClienteNome) filtroClienteNome.oninput = filtrarERenderizarClientes;
    if (filtroClienteTelefone) filtroClienteTelefone.oninput = filtrarERenderizarClientes;
}

document.addEventListener("DOMContentLoaded", setupClientesListeners);

window.setupClientesListeners = setupClientesListeners;
window.alternarParaClientes = alternarParaClientes;
window.carregarClientes = carregarClientes;
window.filtrarERenderizarClientes = filtrarERenderizarClientes;
