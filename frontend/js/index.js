const btnConfirmarQuick = document.getElementById("btnConfirmarQuick");
const quickNumeroInput = document.getElementById("quickNumero");
const btnToggleRightSidebar = document.getElementById("btnToggleRightSidebar");
const sidebar = document.querySelector(".sidebar");
const sidebarRight = document.querySelector(".sidebar-right");
const btnAddItem = document.getElementById("btnAddItem");

// --- ELEMENTOS MODAL PAGAMENTO --- Compartilhados entre módulos
const modalPagamento = document.getElementById("modalPagamento");
const btnFecharModalPagamento = document.getElementById("btnFecharModalPagamento");
const tituloPagamentoModal = document.getElementById("tituloPagamentoModal");
const valorPagamentoInput = document.getElementById("valorPagamentoInput");
const btnLancarPagamentoModal = document.getElementById("btnLancarPagamentoModal");
const tabelaPagamentosBody = document.querySelector("#tabelaPagamentosModal tbody");
const pagTotalComandaEl = document.getElementById("pag-total-comanda");
const pagTotalPagoEl = document.getElementById("pag-total-pago");
const pagSaldoDevedorEl = document.getElementById("pag-saldo-devedor");
const btnFinalizarComandaModal = document.getElementById("btnFinalizarComandaModal");
const metodosButtons = document.querySelectorAll("#modalPagamento .metodo-btn");

// --- ELEMENTOS MODAL DIVIDIR POR ITEM --- Compartilhados entre módulos
const modalDividirItem = document.getElementById("modalDividirItem");
const tbodyDivisaoItens = document.getElementById("tbodyDivisaoItens");
const totalSelecionadoItemEl = document.getElementById("totalSelecionadoItem");
const btnAdicionarAoPagamento = document.getElementById("btnAdicionarAoPagamento");
const btnImprimirDivisao = document.getElementById("btnImprimirDivisao");
const navDashboard = document.getElementById("navDashboard");
const btnAbrirModalCadastroComanda = document.getElementById("btnAbrirModalCadastroComanda");

// --- BOTÕES GLOBAIS / OUTROS MODAIS ---
// const btnImprimirModal = document.getElementById("btnImprimirModal");
const btnSalvarProdutoModal = document.getElementById("btnSalvarProdutoModal");
const btnSalvarProdutoPage = document.getElementById("btnSalvarProdutoPage");
const modalCadastroProduto = document.getElementById("modalCadastroProduto");
const btnFecharModalCadastro = document.getElementById("btnFecharModalCadastro");
const novoCodigoInput = document.getElementById("novoCodigo");
const prodPageCodigo = document.getElementById("prodPageCodigo");
const prodPageDescricao = document.getElementById("prodPageDescricao");

// --- ELEMENTOS DE NAVEGAÇÃO E SEÇÕES ---
const sectionComandas = document.getElementById("sectionComandas");
const sectionProdutos = document.getElementById("sectionProdutos");
const navProdutosSessao = document.getElementById("navProdutosSessao");

// Variáveis globais compartilhadas entre módulos
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

// Aliases para compatibilidade (permite usar sem window.)
var currentComandaNumero, totalComandaGlobal, totalPagoGlobal, saldoDevedorGlobal;
var formaPagamentoSelecionada, itensAgrupadosDivisao, itensSelecionadosParaPagamento;
var produtosCache, produtoSelecionado, estadoOrdenacaoProdutos;

// ===============================
// INICIALIZAÇÃO DO SISTEMA
// ===============================
async function init() {
  console.log("Sistema iniciando...");
  await carregarDashboard();
  await carregarProdutosBase();
  await carregarVendasHoje();
  initToggleVendasHoje();
}

const btnToggleSidebar = document.getElementById("btnToggleSidebar");

if (btnToggleSidebar && sidebar) {
  btnToggleSidebar.onclick = () => {
    sidebar.classList.toggle("collapsed");
  };
}

// ===============================
// ELEMENTOS DO MODAL DA COMANDA (Garantindo acesso no configListeners)
// ===============================
var modalComanda = document.getElementById("modalComanda");
var btnFecharModalComanda = document.getElementById("btnFecharModalComanda");
var tituloComanda = document.getElementById("tituloComanda");
var nomeComanda = document.getElementById("nomeComanda");
var telefoneComanda = document.getElementById("telefoneComanda");
var pessoasComanda = document.getElementById("pessoasComanda");
var qtdPessoasInput = document.getElementById("qtdPessoas");
var buscaCodigo = document.getElementById("buscaCodigo");
var buscaDescricao = document.getElementById("buscaDescricao");
var qtdProduto = document.getElementById("qtdProduto");
var valorProduto = document.getElementById("valorProduto");
var tabelaItensBody = document.querySelector("#tabelaItens tbody");
var totalComandaDiv = document.getElementById("totalComanda");
var valorPorPessoaDiv = document.getElementById("valorPorPessoa");
var btnImprimirModal = document.getElementById("btnImprimirModal");
var btnPagamentoModal = document.getElementById("btnPagamentoModal");
var btnDividirItemModal = document.getElementById("btnDividirItemModal");

// Outros elementos compartilhados
var novaDescricaoInput = document.getElementById("novaDescricao");
var valorNovoProdutoInput = document.getElementById("valorNovoProduto");
var novaUnidadeInput = document.getElementById("novaUnidade");
var novoPrecoCustoInput = document.getElementById("novoPrecoCusto");
var novoGrupoInput = document.getElementById("novoGrupo");
var novoEstoqueInput = document.getElementById("novoEstoque");
var novoEstoqueMinimoInput = document.getElementById("novoEstoqueMinimo");

// ===============================
// LISTENERS E ATALHOS GLOBAIS
// ===============================

function configListeners() {
  if (btnFecharModalComanda) btnFecharModalComanda.onclick = () => { modalComanda.classList.add("hidden"); carregarDashboard(); };
  if (btnFecharModalPagamento) btnFecharModalPagamento.onclick = () => modalPagamento.classList.add("hidden");
  if (btnFecharModalCadastro) btnFecharModalCadastro.onclick = () => { modalCadastroProduto.classList.add("hidden"); carregarProdutosBase(); };
  if (navDashboard) navDashboard.onclick = (e) => { e.preventDefault(); alternarParaDashboard(); };
  if (navProdutosSessao) navProdutosSessao.onclick = (e) => { e.preventDefault(); alternarParaProdutos(); };
  const navFechamentoBtn = document.getElementById("navFechamento");
  if (navFechamentoBtn) navFechamentoBtn.onclick = (e) => { e.preventDefault(); alternarParaFechamento(); };

  if (btnAbrirModalCadastroComanda) {
    btnAbrirModalCadastroComanda.onclick = () => {
      const codBusca = buscaCodigo ? buscaCodigo.value.trim() : "";
      abrirModalCadastroProdutos();
      if (codBusca && novoCodigoInput) {
        novoCodigoInput.value = codBusca;
        if (novaDescricaoInput) novaDescricaoInput.focus();
      }
    };
  }
  if (nomeComanda) {
    nomeComanda.onblur = atualizarComandaAPI;
    nomeComanda.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); telefoneComanda.focus(); } };
  }
  if (telefoneComanda) {
    telefoneComanda.onblur = atualizarComandaAPI;
    telefoneComanda.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); pessoasComanda.focus(); } };
  }
  if (pessoasComanda) {
    pessoasComanda.oninput = () => { if (qtdPessoasInput) qtdPessoasInput.textContent = pessoasComanda.value; atualizarDivisaoTotal(); };
    pessoasComanda.onblur = atualizarComandaAPI;
    pessoasComanda.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); buscaCodigo.focus(); buscaCodigo.select(); } };
  }
  if (buscaCodigo) {
    buscaCodigo.oninput = filtrarProdutosModal;
    buscaCodigo.onkeydown = e => { if (e.key === "Enter") adicionarItemComanda(); };
  }
  if (buscaDescricao) {
    buscaDescricao.oninput = filtrarProdutosModal;
    buscaDescricao.onkeydown = e => { if (e.key === "Enter") adicionarItemComanda(); };
  }
  if (qtdProduto) qtdProduto.onkeydown = e => { if (e.key === "Enter") adicionarItemComanda(); };
  if (valorProduto) {
    valorProduto.onkeydown = e => {
      if (e.key === "Enter" || e.key === "Tab") {
        const cod = buscaCodigo ? buscaCodigo.value.trim() : "";
        const desc = buscaDescricao ? buscaDescricao.value.trim() : "";
        const qtd = qtdProduto ? qtdProduto.value.trim() : "";
        const val = valorProduto.value.trim();

        if (!cod || !desc || !qtd || !val) {
          e.preventDefault();
          alert("Por favor, preencha todos os campos: Cód, Descrição, Qtd e Valor.");
          if (!cod) buscaCodigo.focus();
          else if (!desc) buscaDescricao.focus();
          else if (!qtd) qtdProduto.focus();
          else if (!val) valorProduto.focus();
          return;
        }

        if (e.key === "Enter") {
          adicionarItemComanda();
        } else if (e.key === "Tab") {
          e.preventDefault();
          if (confirm("Adicionar item?")) {
            adicionarItemComanda();
          } else {
            buscaCodigo.focus();
            buscaCodigo.select();
          }
        }
      }
    };
  }

  if (btnDividirItemModal) btnDividirItemModal.onclick = abrirModalDividirItem;
  if (btnImprimirModal) btnImprimirModal.onclick = imprimirComandaAcao;

  if (btnPagamentoModal) btnPagamentoModal.onclick = () => abrirModalPagamento();
  if (btnLancarPagamentoModal) btnLancarPagamentoModal.onclick = lancarPagamentoModal;
  if (valorPagamentoInput) valorPagamentoInput.onkeydown = e => { if (e.key === "Enter") lancarPagamentoModal(); };
  if (btnFinalizarComandaModal) btnFinalizarComandaModal.onclick = finalizarComandaModal;
  const btnVoltarDivisaoModal = document.getElementById("btnVoltarDivisaoModal");
  if (btnVoltarDivisaoModal) btnVoltarDivisaoModal.onclick = () => {
    if (modalPagamento) modalPagamento.classList.add("hidden");
    abrirModalDividirItem();
  };

  if (metodosButtons) {
    metodosButtons.forEach(btn => btn.onclick = () => {
      metodosButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      formaPagamentoSelecionada = btn.dataset.forma;
      if (valorPagamentoInput) {
        valorPagamentoInput.focus();
        valorPagamentoInput.select();
      }
    });
  }

  if (btnAdicionarAoPagamento) {
    btnAdicionarAoPagamento.onclick = () => {
      const totalSelecionadoAgora = parseFloat(btnAdicionarAoPagamento.dataset.totalRaw || 0);

      // Se não tem nada selecionado agora nem acumulado antes, avisa
      if (totalSelecionadoAgora <= 0 && (!itensSelecionadosParaPagamento || itensSelecionadosParaPagamento.length === 0)) {
        return alert("Selecione itens");
      }

      if (totalSelecionadoAgora > 0) {
        // "Considera" o que está selecionado agora antes de abrir o pagamento
        considerarSelecao(true);
      }

      const totalAcumuladoFinal = parseFloat(btnAdicionarAoPagamento.dataset.totalAcumulado || 0);

      if (modalDividirItem) modalDividirItem.classList.add("hidden");

      // Abre o modal de pagamento com o que foi acumulado
      abrirModalPagamento(totalAcumuladoFinal, itensSelecionadosParaPagamento);
    };
  }

  const btnConsiderarSelecao = document.getElementById("btnConsiderarSelecao");
  if (btnConsiderarSelecao) btnConsiderarSelecao.onclick = () => considerarSelecao(false);

  if (btnImprimirDivisao) btnImprimirDivisao.onclick = imprimirDivisaoAcao;

  if (btnSalvarProdutoModal) btnSalvarProdutoModal.onclick = salvarNovoProduto;
  if (btnSalvarProdutoPage) btnSalvarProdutoPage.onclick = salvarNovoProdutoSessao;

  if (prodPageCodigo) prodPageCodigo.oninput = filtrarERenderizarProdutosPage;
  if (prodPageDescricao) prodPageDescricao.oninput = filtrarERenderizarProdutosPage;

  if (novoCodigoInput) {
    novoCodigoInput.oninput = () => {
      const cod = novoCodigoInput.value.trim();
      if (cod.length === 3) {
        const existe = produtosCache.find(p => String(p.codigo) === cod);
        if (existe) {
          alert(`O código ${cod} já está em uso pelo produto: ${existe.descricao}`);
          novoCodigoInput.value = "";
        }
      }
    };
    novoCodigoInput.onblur = () => {
      const cod = novoCodigoInput.value.trim();
      if (cod && !/^\d{3}$/.test(cod)) {
        alert("O código do produto deve ter exatamente 3 dígitos numéricos (ex: 001, 123)");
        setTimeout(() => novoCodigoInput.focus(), 10);
      }
    };
  }

  if (prodPageCodigo) {
    prodPageCodigo.onblur = () => {
      const cod = prodPageCodigo.value.trim();
      if (cod && !/^\d{3}$/.test(cod)) {
        alert("O código do produto deve ter exatamente 3 dígitos numéricos.");
        setTimeout(() => prodPageCodigo.focus(), 10);
      }
    };
  }

  if (btnConfirmarQuick) {
    btnConfirmarQuick.onclick = () => {
      const num = quickNumeroInput ? quickNumeroInput.value : "";
      if (num) {
        abrirComanda(num);
        if (quickNumeroInput) quickNumeroInput.value = "";
      }
    };
  }

  const btnAbrirModalImpFech = document.getElementById("btnAbrirModalImpressaoFechamento");
  if (btnAbrirModalImpFech) btnAbrirModalImpFech.onclick = () => {
    const m = document.getElementById("modalImpressaoFechamento");
    if (m) {
      m.classList.remove("hidden");
      // Focar no botão de imprimir após abrir o modal
      setTimeout(() => {
        const btnImprimir = document.getElementById("btnImprimirFechamentoFinal");
        if (btnImprimir) btnImprimir.focus();
      }, 50);
    }
  };

  const btnImpFechFinal = document.getElementById("btnImprimirFechamentoFinal");
  if (btnImpFechFinal) btnImpFechFinal.onclick = imprimirFechamentoFinal;

  if (quickNumeroInput) {
    quickNumeroInput.onkeydown = e => {
      if (e.key === "Enter") {
        const num = quickNumeroInput.value;
        if (num) {
          abrirComanda(num);
          quickNumeroInput.value = "";
        }
      }
    };
  }



  if (btnToggleRightSidebar && sidebarRight) {
    btnToggleRightSidebar.onclick = () => {
      sidebarRight.classList.toggle("collapsed");
    };
  }
}

document.onkeydown = (e) => {
  if (e.key === "Escape") {
    if (modalDividirItem && !modalDividirItem.classList.contains("hidden")) modalDividirItem.classList.add("hidden");
    else if (modalPagamento && !modalPagamento.classList.contains("hidden")) modalPagamento.classList.add("hidden");
    else if (modalComanda && !modalComanda.classList.contains("hidden")) btnFecharModalComanda.onclick();
    else if (modalCadastroProduto && !modalCadastroProduto.classList.contains("hidden")) modalCadastroProduto.classList.add("hidden");
    else if (modalImpressaoFechamento && !modalImpressaoFechamento.classList.contains("hidden")) modalImpressaoFechamento.classList.add("hidden");
  }
  // Atalhos dentro da Comanda (sem outros modais abertos)
  if (modalComanda && !modalComanda.classList.contains("hidden") &&
    modalPagamento.classList.contains("hidden") &&
    modalDividirItem.classList.contains("hidden") &&
    modalCadastroProduto.classList.contains("hidden")) {
    if (e.key === "F3") { e.preventDefault(); btnAbrirModalCadastroComanda.onclick(); }
    if (e.key === "F4") { e.preventDefault(); abrirModalDividirItem(); }
    if (e.key === "F8") { e.preventDefault(); abrirModalPagamento(); }
    if (e.key === "F9") { e.preventDefault(); imprimirComandaAcao(); }
  }

  // Atalhos dentro do Dividir por Item
  if (modalDividirItem && !modalDividirItem.classList.contains("hidden")) {
    if (e.key === "F9") { e.preventDefault(); imprimirDivisaoAcao(); } // Padronizado F9
    if (e.key === "F5") { e.preventDefault(); considerarSelecao(false); }
    if (e.key === "F8") { e.preventDefault(); btnAdicionarAoPagamento.onclick(); }
  }

  // Atalhos dentro do Fechamento Diário (Modal e Tela)
  const modalImpFech = document.getElementById("modalImpressaoFechamento");
  const secFechamento = document.getElementById("sectionFechamento");

  if (modalImpFech && !modalImpFech.classList.contains("hidden")) {
    if (e.key === "F9") { e.preventDefault(); imprimirFechamentoFinal(); }
  } else if (secFechamento && !secFechamento.classList.contains("hidden")) {
    if (e.key === "F9") {
      e.preventDefault();
      const btn = document.getElementById("btnAbrirModalImpressaoFechamento");
      if (btn) btn.click();
    }
  }


  // Atalhos dentro do Pagamento
  if (modalPagamento && !modalPagamento.classList.contains("hidden")) {
    if (e.key === "F4") { e.preventDefault(); btnVoltarDivisaoModal.onclick(); }
    if (e.key === "F10" && btnFinalizarComandaModal && !btnFinalizarComandaModal.disabled) { e.preventDefault(); finalizarComandaModal(); }
  }

  // Atalhos dentro do Cadastro de Produto (Modal)
  if (modalCadastroProduto && !modalCadastroProduto.classList.contains("hidden")) {
    if (e.key === "F5") { e.preventDefault(); salvarNovoProduto(); }
  }
};

// ===============================
// BOOTSTRAP / STARTUP
// ===============================

// Aguarda o DOM estar pronto e todos os módulos carregados
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM carregado, iniciando sistema...");
  configListeners();

  // Pequeno delay para garantir que todos os módulos foram carregados
  setTimeout(() => {
    init();
  }, 100);
});
