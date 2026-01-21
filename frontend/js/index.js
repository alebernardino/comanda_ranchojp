// ===============================
// MÓDULO: INDEX (ORQUESTRADOR)
// Responsável pela inicialização global, atalhos e layout base.
// ===============================

// Elementos de Layout e Shell
const sidebar = document.querySelector(".sidebar");
const sidebarRight = document.querySelector(".sidebar-right");
const btnToggleSidebar = document.getElementById("btnToggleSidebar");
const btnToggleRightSidebar = document.getElementById("btnToggleRightSidebar");
const quickNumeroInput = document.getElementById("quickNumero");
const btnConfirmarQuick = document.getElementById("btnConfirmarQuick");

// Variáveis globais compartilhadas entre módulos (Shared State)
window.currentComandaNumero = null;
window.totalComandaGlobal = 0;
window.totalPagoGlobal = 0;
window.saldoDevedorGlobal = 0;
window.formaPagamentoSelecionada = "Cartão Crédito";
window.itensAgrupadosDivisao = [];
window.itensSelecionadosParaPagamento = null;
window.produtosCache = [];
window.produtoSelecionado = null;
window.estadoOrdenacaoProdutos = { campo: 'codigo', direcao: 'asc' };

// Aliases para compatibilidade legada (opcional)
var currentComandaNumero, totalComandaGlobal, totalPagoGlobal, saldoDevedorGlobal;
var formaPagamentoSelecionada, itensAgrupadosDivisao, itensSelecionadosParaPagamento;
var produtosCache, produtoSelecionado, estadoOrdenacaoProdutos;

// ===============================
// CARREGAMENTO DE TEMPLATES
// ===============================

async function carregarTemplates() {
  console.log("Carregando templates externos...");
  try {
    const [modals, sections, printing] = await Promise.all([
      fetch("templates/modals.html?v=2").then(r => r.text()),
      fetch("templates/sections.html?v=2").then(r => r.text()),
      fetch("templates/printing.html?v=2").then(r => r.text())
    ]);

    document.getElementById("modalsContainer").innerHTML = modals;
    document.getElementById("sectionsContainer").innerHTML = sections;
    document.getElementById("printingTemplatesContainer").innerHTML = printing;

    console.log("Templates carregados com sucesso!");

    // Após carregar os templates, precisamos avisar os módulos de que os elementos deles agora existem
    if (typeof setupDashboardListeners === "function") setupDashboardListeners();
    if (typeof setupProdutosListeners === "function") setupProdutosListeners();
    if (typeof setupComandaListeners === "function") setupComandaListeners();
    if (typeof setupDivisaoListeners === "function") setupDivisaoListeners();
    if (typeof setupPagamentoListeners === "function") setupPagamentoListeners();
    if (typeof setupFechamentoListeners === "function") setupFechamentoListeners();
    if (typeof setupColaboradoresListeners === "function") setupColaboradoresListeners();
    if (typeof setupClientesListeners === "function") setupClientesListeners();
    if (typeof setupFinanceiroListeners === "function") setupFinanceiroListeners();
    if (typeof setupRelatoriosListeners === "function") setupRelatoriosListeners();

  } catch (err) {
    console.error("Erro ao carregar templates:", err);
  }
}

// ===============================
// INICIALIZAÇÃO
// ===============================

async function init() {
  console.log("Sistema iniciando...");

  // 1. Carrega os templates primeiro
  await carregarTemplates();

  // 2. Inicia os dados
  if (typeof carregarDashboard === "function") await carregarDashboard();
  if (typeof carregarProdutosBase === "function") await carregarProdutosBase();
  if (typeof carregarVendasHoje === "function") await carregarVendasHoje();
  if (typeof initToggleVendasHoje === "function") initToggleVendasHoje();
}

// ===============================
// LISTENERS DE LAYOUT E GERAIS
// ===============================

function setupShellListeners() {
  // Sidebar Esquerda
  if (btnToggleSidebar && sidebar) {
    btnToggleSidebar.onclick = () => {
      sidebar.classList.toggle("collapsed");
    };
  }

  // Sidebar Direita
  if (btnToggleRightSidebar && sidebarRight) {
    btnToggleRightSidebar.onclick = () => {
      sidebarRight.classList.toggle("collapsed");
    };
  }

  // Abrir Comanda Rápido (Header)
  if (btnConfirmarQuick && quickNumeroInput) {
    btnConfirmarQuick.onclick = () => {
      const num = quickNumeroInput.value;
      if (num && typeof abrirComanda === "function") {
        abrirComanda(num);
        quickNumeroInput.value = "";
      }
    };

    quickNumeroInput.onkeydown = e => {
      if (e.key === "Enter") {
        const num = quickNumeroInput.value;
        if (num && typeof abrirComanda === "function") {
          abrirComanda(num);
          quickNumeroInput.value = "";
        }
      }
    };
  }

  // Navegação Principal via Sidebar
  const navDashboard = document.getElementById("navDashboard");
  const navProdutosSessao = document.getElementById("navProdutosSessao");
  const navFechamento = document.getElementById("navFechamento");

  if (navDashboard) navDashboard.onclick = (e) => { e.preventDefault(); if (typeof alternarParaDashboard === "function") alternarParaDashboard(); };
  if (navProdutosSessao) navProdutosSessao.onclick = (e) => { e.preventDefault(); if (typeof alternarParaProdutos === "function") alternarParaProdutos(); };
  if (navFechamento) navFechamento.onclick = (e) => { e.preventDefault(); if (typeof alternarParaFechamento === "function") alternarParaFechamento(); };
}

// ===============================
// ATALHOS DE TECLADO GLOBAIS
// ===============================

document.onkeydown = (e) => {
  // ESC para fechar qualquer modal
  if (e.key === "Escape") {
    const modalPagamento = document.getElementById("modalPagamento");
    const modalComanda = document.getElementById("modalComanda");

    // Se o modal de pagamento estiver aberto, verificar se há saldo devedor
    if (modalPagamento && !modalPagamento.classList.contains("hidden")) {
      const saldoDevedorEl = document.getElementById("pag-saldo-devedor");
      const saldoDevedorText = saldoDevedorEl ? saldoDevedorEl.innerText : "R$ 0,00";
      const saldoDevedor = parseFloat(saldoDevedorText.replace("R$", "").replace(",", ".").trim()) || 0;

      // Se ainda há valor a pagar, voltar para o modal da comanda
      if (saldoDevedor > 0) {
        modalPagamento.classList.add("hidden");
        if (modalComanda) {
          modalComanda.classList.remove("hidden");
          // Focar no campo de busca
          setTimeout(() => {
            const buscaCodigo = document.getElementById("buscaCodigo");
            if (buscaCodigo) buscaCodigo.focus();
          }, 100);
        }
        return; // Não executar o resto do código
      }
    }

    // Comportamento padrão: fechar todos os modais
    const modais = document.querySelectorAll(".modal:not(.hidden)");
    modais.forEach(m => m.classList.add("hidden"));

    // Caso especial comanda: recarregar dashboard ao fechar
    if (modalComanda && !modalComanda.classList.contains("hidden")) {
      if (typeof carregarDashboard === "function") carregarDashboard();
    }
  }

  // Atalhos de Comanda (Apenas se o modal de comanda estiver aberto e outros não)
  const modalComanda = document.getElementById("modalComanda");
  const modalPagamento = document.getElementById("modalPagamento");
  const modalDividirItem = document.getElementById("modalDividirItem");
  const modalCadastroProduto = document.getElementById("modalCadastroProduto");

  const comandaAberta = modalComanda && !modalComanda.classList.contains("hidden");
  const pagAberta = modalPagamento && !modalPagamento.classList.contains("hidden");
  const divAberta = modalDividirItem && !modalDividirItem.classList.contains("hidden");
  const cadAberta = modalCadastroProduto && !modalCadastroProduto.classList.contains("hidden");

  if (comandaAberta && !pagAberta && !divAberta && !cadAberta) {
    if (e.key === "F3") { e.preventDefault(); if (typeof abrirModalCadastroProdutos === "function") abrirModalCadastroProdutos(); }
    if (e.key === "F4") { e.preventDefault(); if (typeof abrirModalDividirItem === "function") abrirModalDividirItem(); }
    if (e.key === "F8") { e.preventDefault(); if (typeof abrirModalPagamento === "function") abrirModalPagamento(); }
    if (e.key === "F9") { e.preventDefault(); if (typeof imprimirComandaAcao === "function") imprimirComandaAcao(); }
  }

  // Atalhos Dividir Item
  if (divAberta) {
    if (e.key === "F9") { e.preventDefault(); if (typeof imprimirDivisaoAcao === "function") imprimirDivisaoAcao(); }
    if (e.key === "F5") { e.preventDefault(); if (typeof considerarSelecao === "function") considerarSelecao(false); }
    if (e.key === "F8") {
      e.preventDefault();
      const btn = document.getElementById("btnAdicionarAoPagamento");
      if (btn) btn.click();
    }
  }

  // Atalhos Pagamento
  if (pagAberta) {
    if (e.key === "F4") {
      e.preventDefault();
      const btn = document.getElementById("btnVoltarDivisaoModal");
      if (btn) btn.click();
    }
    if (e.key === "F10") {
      e.preventDefault();
      const btn = document.getElementById("btnFinalizarComandaModal");
      if (btn && !btn.disabled) btn.click();
    }
  }

  // Atalhos Fechamento
  const secFechamento = document.getElementById("sectionFechamento");
  if (secFechamento && !secFechamento.classList.contains("hidden")) {
    const modalImpFech = document.getElementById("modalImpressaoFechamento");
    if (modalImpFech && !modalImpFech.classList.contains("hidden")) {
      if (e.key === "F9") { e.preventDefault(); if (typeof imprimirFechamentoFinal === "function") imprimirFechamentoFinal(); }
    } else {
      if (e.key === "F9") {
        e.preventDefault();
        const btn = document.getElementById("btnAbrirModalImpressaoFechamento");
        if (btn) btn.click();
      }
    }
  }
};

// ===============================
// DOM CONTENT LOADED
// ===============================

document.addEventListener('DOMContentLoaded', () => {
  setupShellListeners();

  // Pequeno delay para garantir que todos os outros módulos (scripts) foram interpretados
  setTimeout(() => {
    init();
  }, 100);
});
