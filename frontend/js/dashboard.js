// ===============================
// MÓDULO: DASHBOARD
// Gerenciamento do dashboard principal e grid de comandas
// ===============================

// Elementos DOM
const grid = document.getElementById("comandasGrid");
const statsLivres = document.getElementById("stats-livres");
const statsOcupadas = document.getElementById("stats-ocupadas");

// Constantes
const TOTAL_COMANDAS = 300;

// ===============================
// FUNÇÕES PÚBLICAS
// ===============================

async function carregarDashboard() {
    try {
        const comandas = await getComandas();
        const abertasArray = comandas.filter(c => c.status === "aberta");
        const mapaAbertas = {};
        abertasArray.forEach(c => { mapaAbertas[c.numero] = c; });

        renderizarGrid(mapaAbertas);
        atualizarStats(abertasArray);
    } catch (err) {
        console.error("Erro ao carregar dashboard:", err);
    }
}

function renderizarGrid(mapAbertas) {
    if (!grid) return;
    grid.innerHTML = "";
    for (let i = 1; i <= TOTAL_COMANDAS; i++) {
        const card = document.createElement("div");
        const estaAberta = mapAbertas[i] !== undefined;
        card.className = estaAberta ? "comanda-card ocupada" : "comanda-card disponivel";
        card.innerHTML = `<span>${i}</span>`;
        card.onclick = () => abrirComanda(i);
        grid.appendChild(card);
    }
}

function atualizarStats(abertas) {
    // Filtra apenas as comandas que estão dentro do intervalo do grid (1 a TOTAL_COMANDAS)
    const abertasVisiveis = abertas.filter(c => c.numero >= 1 && c.numero <= TOTAL_COMANDAS);

    if (statsOcupadas) statsOcupadas.innerText = abertasVisiveis.length;
    if (statsLivres) statsLivres.innerText = Math.max(0, TOTAL_COMANDAS - abertasVisiveis.length);
}

function atualizarCardComanda(numeroComanda, estaAberta) {
    if (!grid) return;

    // Encontra o card específico no grid
    const cards = grid.children;
    const cardIndex = numeroComanda - 1; // Array é 0-indexed

    if (cardIndex >= 0 && cardIndex < cards.length) {
        const card = cards[cardIndex];
        if (estaAberta) {
            card.className = "comanda-card ocupada";
        } else {
            card.className = "comanda-card disponivel";
        }
    }

    // Atualizar stats também
    if (typeof carregarDashboard === "function") {
        carregarDashboard();
    }
}

async function carregarVendasHoje() {
    const tbody = document.getElementById("tbodyVendasHoje");
    if (!tbody) return;

    try {
        // Usar data local ao invés de UTC para evitar deslocamento de fuso horário
        const agora = new Date();
        const ano = agora.getFullYear();
        const mes = String(agora.getMonth() + 1).padStart(2, '0');
        const dia = String(agora.getDate()).padStart(2, '0');
        const hojeInicio = `${ano}-${mes}-${dia} 00:00:00`;
        const hojeFim = `${ano}-${mes}-${dia} 23:59:59`;

        const resposta = await getRelatorioVendas('dia', hojeInicio, hojeFim, '');

        // A API retorna um objeto com várias propriedades, usamos 'geral' que contém os produtos
        const dados = resposta.geral || [];

        tbody.innerHTML = "";

        if (!dados || dados.length === 0) {
            tbody.innerHTML = '<tr><td colspan="2" style="padding: 15px; text-align: center; color: #94a3b8;">Nenhuma venda hoje</td></tr>';
            return;
        }

        // Ordenar por quantidade decrescente
        dados.sort((a, b) => b.total_qtd - a.total_qtd);

        dados.forEach(item => {
            const tr = document.createElement("tr");
            tr.classList.add("table-row");
            tr.innerHTML = `
        <td style="padding: 8px; color: #1e293b;">${item.descricao}</td>
        <td style="padding: 8px; text-align: center; font-weight: 700; color: #3b82f6;">${item.total_qtd}</td>
      `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error("Erro ao carregar vendas de hoje:", err);
        tbody.innerHTML = '<tr><td colspan="2" style="padding: 15px; text-align: center; color: #ef4444;">Erro ao carregar</td></tr>';
    }
}

function initToggleVendasHoje() {
    const btn = document.getElementById("toggleVendasHojeBtn");
    const container = document.getElementById("vendasHojeContainer");
    const icon = document.getElementById("toggleVendasIcon");

    if (!btn || !container || !icon) return;

    btn.onclick = () => {
        const isOpen = container.style.maxHeight && container.style.maxHeight !== "0px";

        if (isOpen) {
            container.style.maxHeight = "0";
            icon.style.transform = "rotate(0deg)";
        } else {
            container.style.maxHeight = "400px";
            icon.style.transform = "rotate(180deg)";
        }
    };
}

function setupDashboardListeners() {
    initToggleVendasHoje();
}

// Para retrocompatibilidade se carregado diretamente
document.addEventListener("DOMContentLoaded", setupDashboardListeners);

function alternarParaDashboard() {
    const sectionProdutos = document.getElementById("sectionProdutos");
    const sectionComandas = document.getElementById("sectionComandas");
    const navProdutosSessao = document.getElementById("navProdutosSessao");
    const navDashboard = document.getElementById("navDashboard");

    sectionProdutos.classList.add("hidden");
    sectionComandas.classList.remove("hidden");
    if (document.getElementById("sectionColaboradores")) document.getElementById("sectionColaboradores").classList.add("hidden");
    if (document.getElementById("sectionClientes")) document.getElementById("sectionClientes").classList.add("hidden");
    if (document.getElementById("sectionFinanceiro")) document.getElementById("sectionFinanceiro").classList.add("hidden");
    if (document.getElementById("sectionRelatorios")) document.getElementById("sectionRelatorios").classList.add("hidden");
    if (document.getElementById("sectionFluxoCaixa")) document.getElementById("sectionFluxoCaixa").classList.add("hidden");
    if (document.getElementById("sectionFechamento")) document.getElementById("sectionFechamento").classList.add("hidden");

    navProdutosSessao.classList.remove("active");
    navDashboard.classList.add("active");
    if (document.getElementById("navColaboradores")) document.getElementById("navColaboradores").classList.remove("active");
    if (document.getElementById("navClientes")) document.getElementById("navClientes").classList.remove("active");
    if (document.getElementById("navFinanceiro")) document.getElementById("navFinanceiro").classList.remove("active");
    if (document.getElementById("navRelatorios")) document.getElementById("navRelatorios").classList.remove("active");
    if (document.getElementById("navFechamento")) document.getElementById("navFechamento").classList.remove("active");

    carregarDashboard();
}

// ===============================
// EXPOSIÇÃO GLOBAL DAS FUNÇÕES
// ===============================
window.carregarDashboard = carregarDashboard;
window.renderizarGrid = renderizarGrid;
window.atualizarStats = atualizarStats;
window.atualizarCardComanda = atualizarCardComanda;
window.carregarVendasHoje = carregarVendasHoje;
window.initToggleVendasHoje = initToggleVendasHoje;
window.alternarParaDashboard = alternarParaDashboard;
