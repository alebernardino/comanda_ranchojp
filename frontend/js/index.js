const grid = document.getElementById("comandasGrid");
const statsLivres = document.getElementById("stats-livres");
const statsOcupadas = document.getElementById("stats-ocupadas");
const btnConfirmarQuick = document.getElementById("btnConfirmarQuick");
const quickNumeroInput = document.getElementById("quickNumero");
const btnToggleRightSidebar = document.getElementById("btnToggleRightSidebar");
const sidebar = document.querySelector(".sidebar");
const sidebarRight = document.querySelector(".sidebar-right");

// --- ELEMENTOS MODAL COMANDA ---
const modalComanda = document.getElementById("modalComanda");
const btnFecharModalComanda = document.getElementById("btnFecharModalComanda");
const tituloComanda = document.getElementById("tituloComanda");
const nomeComanda = document.getElementById("nomeComanda");
const telefoneComanda = document.getElementById("telefoneComanda");
const pessoasComanda = document.getElementById("pessoasComanda");
const buscaCodigo = document.getElementById("buscaCodigo");
const buscaDescricao = document.getElementById("buscaDescricao");
const qtdProduto = document.getElementById("qtdProduto");
const valorProduto = document.getElementById("valorProduto");
const btnAddItem = document.getElementById("btnAddItem");
const tabelaItensBody = document.querySelector("#tabelaItens tbody");
const totalComandaDiv = document.getElementById("totalComanda");
const listaProdutos = document.getElementById("listaProdutos");
const qtdPessoasInput = document.getElementById("qtdPessoas");
const valorPorPessoaDiv = document.getElementById("valorPorPessoa");
const btnPagamentoModal = document.getElementById("btnPagamentoModal");
const btnDividirItemModal = document.getElementById("btnDividirItemModal");
const btnImprimirModal = document.getElementById("btnImprimirModal");

// --- ELEMENTOS MODAL PAGAMENTO ---
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

// --- ELEMENTOS MODAL DIVIDIR POR ITEM ---
const modalDividirItem = document.getElementById("modalDividirItem");
const tbodyDivisaoItens = document.getElementById("tbodyDivisaoItens");
const totalSelecionadoItemEl = document.getElementById("totalSelecionadoItem");
const btnAdicionarAoPagamento = document.getElementById("btnAdicionarAoPagamento");

// --- ELEMENTOS MODAL CADASTRO PRODUTO ---
const modalCadastroProduto = document.getElementById("modalCadastroProduto");
const navDashboard = document.getElementById("navDashboard");
const navProdutosSessao = document.getElementById("navProdutosSessao");
const sectionComandas = document.getElementById("sectionComandas");
const sectionProdutos = document.getElementById("sectionProdutos");

const btnAbrirModalCadastroComanda = document.getElementById("btnAbrirModalCadastroComanda");
const btnFecharModalCadastro = document.getElementById("btnFecharModalCadastro");
const novoCodigoInput = document.getElementById("novoCodigo");
const novaDescricaoInput = document.getElementById("novaDescricao");
const valorNovoProdutoInput = document.getElementById("valorNovoProduto");
const tabelaProdutosModalBody = document.querySelector("#tabelaProdutosModal tbody");

// --- ELEMENTOS PÁGINA CADASTRO PRODUTO (SESSÃO) ---
const prodPageCodigo = document.getElementById("prodPageCodigo");
const prodPageDescricao = document.getElementById("prodPageDescricao");
const prodPageValor = document.getElementById("prodPageValor");
const btnSalvarProdutoPage = document.getElementById("btnSalvarProdutoPage");
const tabelaProdutosPageBody = document.getElementById("tabelaProdutosPageBody");

// ===============================
// CONFIGURAÇÃO E ESTADO GLOBAL
// ===============================
const TOTAL_COMANDAS = 300;
let currentComandaNumero = null;

let totalComandaGlobal = 0;
let totalPagoGlobal = 0;
let saldoDevedorGlobal = 0;
let formaPagamentoSelecionada = "Cartão Crédito";
let itensAgrupadosDivisao = [];
let itensSelecionadosParaPagamento = null;

// ===============================
// DASHBOARD (TELA)
// ===============================
async function init() {
  console.log("Sistema iniciando...");
  await carregarDashboard();
  await carregarProdutosBase();
  await carregarVendasHoje();
  initToggleVendasHoje();
}

async function carregarDashboard() {
  try {
    const res = await fetch(`${API_URL}/comandas/`);
    const abertas = await res.json();
    const mapaAbertas = {};
    abertas.forEach(c => { mapaAbertas[c.numero] = c; });
    renderizarGrid(mapaAbertas);
    atualizarStats(abertas);
  } catch (err) { console.error("Erro ao carregar dashboard:", err); }
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

const btnToggleSidebar = document.getElementById("btnToggleSidebar");

if (btnToggleSidebar && sidebar) {
  btnToggleSidebar.onclick = () => {
    sidebar.classList.toggle("collapsed");
  };
}

// ===============================
// MODAL COMANDA
// ===============================

async function abrirComanda(numero) {
  if (!numero) return;
  // Se mudou de comanda, limpa seleção anterior
  if (currentComandaNumero !== numero) {
    itensSelecionadosParaPagamento = null;
    sessionStorage.removeItem(`comanda_${numero}_selecao`);
  }
  currentComandaNumero = numero;
  itensSelecionadosParaPagamento = JSON.parse(sessionStorage.getItem(`comanda_${numero}_selecao`) || "null");
  try {

    // Tenta buscar a comanda primeiro para evitar o erro 400 no console
    const checkRes = await fetch(`${API_URL}/comandas/${numero}`);

    if (checkRes.status === 404) {
      // Não existe, cria
      const createRes = await fetch(`${API_URL}/comandas/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numero: Number(numero) })
      });
      if (!createRes.ok) return alert("Erro ao criar comanda");
    } else if (!checkRes.ok) {
      // Erro desconhecido ao buscar
      return alert("Erro ao acessar comanda");
    }
    // Se 200, ela existe e está tudo bem, seguimos para abrir.

    if (modalComanda) modalComanda.classList.remove("hidden");
    await carregarDadosComanda();
    await carregarItensComanda();

    setTimeout(() => {
      const temItens = tabelaItensBody && tabelaItensBody.children.length > 0;
      if (!temItens) {
        if (nomeComanda) {
          nomeComanda.focus();
          nomeComanda.select();
        }
      } else {
        if (buscaCodigo) {
          buscaCodigo.focus();
          buscaCodigo.select();
        }
      }
    }, 150);
  } catch (err) { console.error(err); }
}

async function carregarDadosComanda() {
  const res = await fetch(`${API_URL}/comandas/${currentComandaNumero}`);
  const comanda = await res.json();
  if (tituloComanda) tituloComanda.innerText = `Comanda ${comanda.numero}`;
  if (nomeComanda) nomeComanda.value = comanda.nome || "";
  if (telefoneComanda) telefoneComanda.value = comanda.telefone || "";
  if (pessoasComanda) pessoasComanda.value = comanda.quantidade_pessoas || 1;
  if (qtdPessoasInput) qtdPessoasInput.value = comanda.quantidade_pessoas || 1;
  renderizarProdutosModal(produtosCache);
}

async function carregarItensComanda() {
  const res = await fetch(`${API_URL}/comandas/${currentComandaNumero}/itens`);
  const itens = await res.json();
  renderizarTabelaItens(itens);
}

function renderizarTabelaItens(itens) {
  if (!tabelaItensBody) return;
  tabelaItensBody.innerHTML = "";
  let total = 0;
  const mapa = {};
  itens.forEach(i => { if (!mapa[i.id]) mapa[i.id] = i; });

  const itensLista = Object.values(mapa).sort((a, b) => String(a.codigo).localeCompare(String(b.codigo), undefined, { numeric: true }));

  itensLista.forEach(item => {
    total += item.subtotal;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.codigo}</td>
      <td>${item.descricao}</td>
      <td>
        <div class="qtd-container">
          <button class="btn-qtd" onclick="removerUmItemIndex(${JSON.stringify(item).replace(/"/g, '&quot;')})">-</button>
          <button class="btn-qtd" onclick="adicionarMaisItemIndex(${JSON.stringify(item).replace(/"/g, '&quot;')})">+</button>
          <span class="qtd-item">${item.quantidade}</span>
          <button class="btn-remover-mini" onclick="removerItemUnico(${item.id})">×</button>
        </div>
      </td>
      <td>R$ ${formatarMoeda(item.valor)}</td>
      <td style="text-align: right;">R$ ${formatarMoeda(item.subtotal)}</td>
    `;
    tabelaItensBody.appendChild(tr);
  });
  if (totalComandaDiv) totalComandaDiv.innerHTML = `<strong>TOTAL: R$ ${formatarMoeda(total)}</strong>`;
  totalComandaGlobal = total;
  atualizarDivisaoTotal();
}

async function removerItemUnico(id) {
  if (!confirm("Remover este item?")) return;
  await fetch(`${API_URL}/itens/${id}`, { method: "DELETE" });
  await carregarItensComanda();
}

async function adicionarMaisItemIndex(item) {
  const res = await fetch(`${API_URL}/comandas/${currentComandaNumero}/itens`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      codigo: String(item.codigo),
      descricao: String(item.descricao),
      quantidade: 1,
      valor: item.valor
    })
  });
  if (res.ok) await carregarItensComanda();
}

async function removerUmItemIndex(item) {
  if (item.quantidade <= 1) {
    if (confirm("Deseja remover o item?")) {
      await removerItemUnico(item.id);
    }
    return;
  }

  // Se quantidade > 1, decrementa via PUT
  const novaQtd = item.quantidade - 1;
  await fetch(`${API_URL}/itens/${item.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      codigo: String(item.codigo),
      descricao: String(item.descricao),
      quantidade: novaQtd,
      valor: item.valor
    })
  });
  await carregarItensComanda();
}

async function atualizarComandaAPI() {
  if (!currentComandaNumero) return;
  await fetch(`${API_URL}/comandas/${currentComandaNumero}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      numero: currentComandaNumero,
      nome: (nomeComanda ? nomeComanda.value.trim() : null) || null,
      telefone: (telefoneComanda ? telefoneComanda.value.trim() : null) || null
    })
  });
}

async function carregarProdutosBase() {
  const res = await fetch(`${API_URL}/produtos/`);
  produtosCache = await res.json();
  produtosCache.sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true }));
}

function renderizarProdutosModal(lista) {
  if (!listaProdutos) return;
  listaProdutos.innerHTML = "";
  lista.forEach(p => {
    const div = document.createElement("div");
    div.className = "produto-item";
    if (!p.ativo) div.style.opacity = "0.5"; // Visual feedback for inactive products
    div.innerHTML = `<span class="produto-cod">${p.codigo}</span><span class="produto-desc">${p.descricao}</span><span class="produto-valor">R$ ${formatarMoeda(p.valor)}</span>`;
    div.onclick = () => selecionarProduto(p);
    listaProdutos.appendChild(div);
  });
}

function selecionarProduto(p) {
  produtoSelecionado = p;
  if (buscaCodigo) buscaCodigo.value = p.codigo;
  if (buscaDescricao) buscaDescricao.value = p.descricao;
  if (valorProduto) valorProduto.value = p.valor.toFixed(2);
  if (qtdProduto) {
    qtdProduto.value = "1";
    qtdProduto.focus();
    qtdProduto.select();
  }
}

function filtrarProdutosModal() {
  const cod = buscaCodigo ? buscaCodigo.value.trim() : "";
  const desc = buscaDescricao ? buscaDescricao.value.trim().toLowerCase() : "";
  const filtrados = produtosCache.filter(p => (cod === "" || String(p.codigo).startsWith(cod)) && (desc === "" || p.descricao.toLowerCase().includes(desc)));
  renderizarProdutosModal(filtrados);

  // Se o código tem 3 dígitos e encontramos um match exato, selecionamos e focamos na Qtd
  if (cod.length === 3) {
    const match = produtosCache.find(p => String(p.codigo) === cod);
    if (match) {
      selecionarProduto(match);
      return;
    }
  }

  // Comportamento padrão de busca parcial
  const match = produtosCache.find(p => String(p.codigo) === cod);
  if (match) {
    produtoSelecionado = match;
    if (buscaDescricao) buscaDescricao.value = match.descricao;
    if (valorProduto) valorProduto.value = match.valor.toFixed(2);
  } else {
    produtoSelecionado = null;
    if (document.activeElement !== buscaDescricao) buscaDescricao.value = "";
    if (valorProduto) valorProduto.value = "";
  }
}

function abrirModalCadastroProdutos() {
  if (modalCadastroProduto) {
    modalCadastroProduto.classList.remove("hidden");
    // Limpar campos
    if (novoCodigoInput) novoCodigoInput.value = "";
    if (novaDescricaoInput) novaDescricaoInput.value = "";
    if (novoValorInput) novoValorInput.value = "";
    if (novoGrupoInput) novoGrupoInput.value = "";
    // Focar no código
    if (novoCodigoInput) novoCodigoInput.focus();
  }
}

async function adicionarItemComanda() {
  if (!produtoSelecionado) {
    const cod = buscaCodigo ? buscaCodigo.value.trim() : "";
    const match = produtosCache.find(p => String(p.codigo) === cod);
    if (match) produtoSelecionado = match;
    else return alert("Selecione um produto cadastrado.");
  }

  const qtd = parseInt(qtdProduto ? qtdProduto.value : 1) || 1;
  const val = parseFloat(valorProduto ? valorProduto.value : 0) || produtoSelecionado.valor;

  const res = await fetch(`${API_URL}/comandas/${currentComandaNumero}/itens`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ codigo: String(produtoSelecionado.codigo), descricao: String(produtoSelecionado.descricao), quantidade: qtd, valor: val })
  });

  if (res.ok) {
    if (buscaCodigo) { buscaCodigo.value = ""; buscaCodigo.focus(); }
    if (buscaDescricao) buscaDescricao.value = "";
    if (qtdProduto) qtdProduto.value = "";
    if (valorProduto) valorProduto.value = "";
    produtoSelecionado = null;
    await carregarItensComanda();
    renderizarProdutosModal(produtosCache);
  }
}

function atualizarDivisaoTotal() {
  if (!valorPorPessoaDiv) return;
  const qtd = parseInt(qtdPessoasInput ? qtdPessoasInput.value : 1) || 1;
  valorPorPessoaDiv.innerText = `R$ ${formatarMoeda(totalComandaGlobal / qtd)}`;
}

// ===============================
// MODAL DIVIDIR POR ITEM
// ===============================

async function abrirModalDividirItem() {
  if (modalDividirItem) modalDividirItem.classList.remove("hidden");
  const tituloPartial = document.getElementById("tituloPartialPrint");
  if (tituloPartial) tituloPartial.innerText = `Comanda ${currentComandaNumero} | valor parcial`;
  const res = await fetch(`${API_URL}/comandas/${currentComandaNumero}/itens`);
  if (!res.ok) return;
  const itens = await res.json();

  const mapa = {};
  itens.forEach(i => {
    // Busca se este item físico já está "considerado" na seleção atual
    const jaConsid = (itensSelecionadosParaPagamento || []).find(x => x.id === i.id)?.quantidade || 0;

    if (!mapa[i.codigo]) {
      mapa[i.codigo] = {
        codigo: i.codigo,
        descricao: i.descricao,
        valor: i.valor,
        total_quantidade: i.quantidade,
        total_paga: i.quantidade_paga || 0,
        total_considerado: jaConsid,
        itens_originais: [{
          id: i.id,
          quantidade: i.quantidade,
          quantidade_paga: i.quantidade_paga || 0,
          quantidade_considerada: jaConsid
        }]
      };
    } else {
      mapa[i.codigo].total_quantidade += i.quantidade;
      mapa[i.codigo].total_paga += i.quantidade_paga || 0;
      mapa[i.codigo].total_considerado += jaConsid;
      mapa[i.codigo].itens_originais.push({
        id: i.id,
        quantidade: i.quantidade,
        quantidade_paga: i.quantidade_paga || 0,
        quantidade_considerada: jaConsid
      });
    }
  });

  itensAgrupadosDivisao = Object.values(mapa);
  renderizarTabelaDivisao();
}

function renderizarTabelaDivisao() {
  if (!tbodyDivisaoItens) return;
  tbodyDivisaoItens.innerHTML = "";
  itensAgrupadosDivisao.forEach(item => {
    const jaConsiderado = item.total_considerado || 0;
    const pagoVisual = item.total_paga + jaConsiderado;
    const disponivelParaSelecionar = item.total_quantidade - pagoVisual;

    const tr = document.createElement("tr");
    tr.classList.add("item-divisao-row");
    if (disponivelParaSelecionar <= 0) tr.classList.add("zero-print");
    else tr.classList.add("zero-print"); // Começa como zero-print se o valor inicial for 0

    tr.innerHTML = `
      <td style="padding: 8px;">${item.codigo}</td>
      <td>${item.descricao}</td>
      <td style="text-align: center;">${item.total_quantidade}</td>
      <td style="text-align: center;">${pagoVisual.toFixed(0)}</td>
      <td style="text-align: center;" class="qtd-disponivel-modal">${disponivelParaSelecionar}</td>
      <td style="text-align: center;">
        <span class="print-only-qty" style="display:none;">0</span>
        <input type="number" value="0" min="0" max="${disponivelParaSelecionar}" class="qtd-pagar-item" style="width: 50px; text-align: center; margin: 0;" ${disponivelParaSelecionar <= 0 ? 'disabled' : ''}>
      </td>
      <td>R$ ${formatarMoeda(item.valor)}</td>
      <td class="subtotal-item">R$ 0,00</td>
    `;

    const input = tr.querySelector(".qtd-pagar-item");
    const printQty = tr.querySelector(".print-only-qty");
    const disponivelEl = tr.querySelector(".qtd-disponivel-modal");

    if (input) {
      input.oninput = () => {
        let val = parseInt(input.value) || 0;
        if (val > disponivelParaSelecionar) val = disponivelParaSelecionar;
        if (val < 0) val = 0;
        input.value = val;
        item.selecionado = val;

        // Controle de impressão
        if (val > 0) tr.classList.remove("zero-print");
        else tr.classList.add("zero-print");
        if (printQty) printQty.innerText = val;

        // Atualiza Restante Visualmente
        if (disponivelEl) {
          disponivelEl.innerText = (disponivelParaSelecionar - val).toString();
        }

        tr.querySelector(".subtotal-item").innerText = `R$ ${formatarMoeda(val * item.valor)}`;
        atualizarTotalSelecionadoItem();
      };
    }
    tbodyDivisaoItens.appendChild(tr);
  });
  atualizarTotalSelecionadoItem();
}

function atualizarTotalSelecionadoItem() {
  let total = 0;
  itensAgrupadosDivisao.forEach(i => {
    total += ((i.selecionado || 0) + (i.total_considerado || 0)) * i.valor;
  });
  if (totalSelecionadoItemEl) totalSelecionadoItemEl.innerText = `R$ ${formatarMoeda(total)}`;
  if (btnAdicionarAoPagamento) btnAdicionarAoPagamento.dataset.totalRaw = total;
  if (btnAdicionarAoPagamento) btnAdicionarAoPagamento.dataset.totalAcumulado = total;
}

async function considerarSelecao(silencioso = false) {
  const total = parseFloat(btnAdicionarAoPagamento.dataset.totalRaw || 0);
  if (total <= 0) {
    if (!silencioso) alert("Selecione pelo menos um item");
    return;
  }

  const breakdown = [];
  itensAgrupadosDivisao.forEach(item => {
    let sel = item.selecionado || 0;
    if (sel > 0) {
      item.itens_originais.forEach(orig => {
        if (sel <= 0) return;
        const disp = orig.quantidade - (orig.quantidade_paga || 0) - (orig.quantidade_considerada || 0);
        if (disp > 0) {
          const pagar = Math.min(sel, disp);
          breakdown.push({ id: orig.id, quantidade: pagar });
          orig.quantidade_considerada = (orig.quantidade_considerada || 0) + pagar;
          sel -= pagar;
        }
      });
      item.total_considerado = (item.total_considerado || 0) + (item.selecionado || 0);
      item.selecionado = 0;
    }
  });

  if (!itensSelecionadosParaPagamento) itensSelecionadosParaPagamento = [];
  breakdown.forEach(b => {
    const existente = itensSelecionadosParaPagamento.find(x => x.id === b.id);
    if (existente) existente.quantidade += b.quantidade;
    else itensSelecionadosParaPagamento.push(b);
  });

  let totalAcumuladoVal = 0;
  itensAgrupadosDivisao.forEach(i => {
    totalAcumuladoVal += (i.total_considerado || 0) * i.valor;
  });

  sessionStorage.setItem(`comanda_${currentComandaNumero}_selecao`, JSON.stringify(itensSelecionadosParaPagamento));

  btnAdicionarAoPagamento.dataset.totalAcumulado = totalAcumuladoVal;
  totalSelecionadoItemEl.innerText = `R$ ${formatarMoeda(totalAcumuladoVal)}`;

  renderizarTabelaDivisao();
}

// ===============================
// MODAL PAGAMENTO
// ===============================

async function abrirModalPagamento(valorSugerido = null, itensBreakdown = null) {
  if (modalPagamento) modalPagamento.classList.remove("hidden");
  if (tituloPagamentoModal) tituloPagamentoModal.innerText = `Pagamento Comanda ${currentComandaNumero}`;
  itensSelecionadosParaPagamento = itensBreakdown;

  await carregarResumoPagamento(valorSugerido);
  await carregarPagamentosModal();

  formaPagamentoSelecionada = "Cartão Crédito";
  if (metodosButtons) metodosButtons.forEach(b => b.classList.toggle("active", b.dataset.forma === formaPagamentoSelecionada));

  setTimeout(() => {
    const btn =
      modalPagamento.querySelector(".metodo-btn.active") ||
      modalPagamento.querySelector(".metodo-btn");

    if (btn) btn.focus();
  }, 50);
}

async function carregarResumoPagamento(valorSugerido = null) {
  const res = await fetch(`${API_URL}/comandas/${currentComandaNumero}/resumo`);
  const data = await res.json();
  totalComandaGlobal = data.total_itens;
  totalPagoGlobal = data.total_pago;
  saldoDevedorGlobal = Math.max(0, totalComandaGlobal - totalPagoGlobal);

  if (pagTotalComandaEl) pagTotalComandaEl.innerText = `R$ ${formatarMoeda(totalComandaGlobal)}`;
  if (pagTotalPagoEl) pagTotalPagoEl.innerText = `R$ ${formatarMoeda(totalPagoGlobal)}`;
  if (pagSaldoDevedorEl) pagSaldoDevedorEl.innerText = `R$ ${formatarMoeda(saldoDevedorGlobal)}`;

  if (valorPagamentoInput) {
    if (valorSugerido !== null) valorPagamentoInput.value = parseFloat(valorSugerido).toFixed(2);
    else valorPagamentoInput.value = saldoDevedorGlobal > 0.001 ? saldoDevedorGlobal.toFixed(2) : "0.00";
  }
  // if (btnFinalizarComandaModal) btnFinalizarComandaModal.disabled = !data.pode_fechar || data.status === 'finalizada';
  // Mantemos o botão habilitado para dar feedback ao usuário se ele tentar finalizar sem pagar
  if (btnFinalizarComandaModal) {
    if (data.status === 'finalizada') {
      btnFinalizarComandaModal.disabled = true;
      btnFinalizarComandaModal.innerText = "Finalizado";
    } else {
      btnFinalizarComandaModal.disabled = false;
      btnFinalizarComandaModal.innerText = "Finalizar Comanda (F10)";
    }
  }
}

async function carregarPagamentosModal() {
  const res = await fetch(`${API_URL}/comandas/${currentComandaNumero}/pagamentos`);
  const pagamentos = await res.json();
  if (tabelaPagamentosBody) {
    tabelaPagamentosBody.innerHTML = "";
    pagamentos.forEach(p => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${p.forma}</td><td style="text-align: right;">R$ ${formatarMoeda(p.valor)}</td><td style="text-align: center;"><button class="btn-remover-mini" onclick="removerPagamentoModal(${p.id})">×</button></td>`;
      tabelaPagamentosBody.appendChild(tr);
    });
  }
}

async function lancarPagamentoModal() {
  const v = parseFloat(valorPagamentoInput ? valorPagamentoInput.value : 0);
  if (isNaN(v) || v <= 0) return alert("Valor inválido");

  const res = await fetch(`${API_URL}/comandas/${currentComandaNumero}/pagamentos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ forma: formaPagamentoSelecionada, valor: v, itens: itensSelecionadosParaPagamento })
  });

  if (res.ok) {
    if (valorPagamentoInput) valorPagamentoInput.value = "";

    // Limpa breakdown acumulado após lançar
    itensSelecionadosParaPagamento = null;
    if (itensAgrupadosDivisao) {
      itensAgrupadosDivisao.forEach(i => {
        i.total_considerado = 0;
        i.itens_originais.forEach(orig => orig.quantidade_considerada = 0);
      });
    }
    if (totalSelecionadoItemEl) totalSelecionadoItemEl.innerText = "R$ 0,00";
    if (btnAdicionarAoPagamento) {
      btnAdicionarAoPagamento.dataset.totalRaw = "0";
      btnAdicionarAoPagamento.dataset.totalAcumulado = "0";
    }

    await carregarResumoPagamento();
    await carregarPagamentosModal();

    // Verificar saldo restante e focar no elemento apropriado
    if (saldoDevedorGlobal > 0) {
      // Ainda há saldo a pagar - foco no método de pagamento
      const primeiroMetodo = modalPagamento ? modalPagamento.querySelector(".metodo-btn") : null;
      if (primeiroMetodo) primeiroMetodo.focus();
    } else {
      // Pagamento completo - foco no botão Finalizar
      const btnFinalizar = document.getElementById("btnFinalizarComandaModal");
      if (btnFinalizar) btnFinalizar.focus();
    }
  } else {
    const err = await res.json(); alert(err.detail);
  }
}

async function removerPagamentoModal(id) {
  if (!confirm("Remover este pagamento?")) return;
  await fetch(`${API_URL}/pagamentos/${id}`, { method: "DELETE" });
  await carregarResumoPagamento();
  await carregarPagamentosModal();
}

async function imprimirResumoPagamento() {
  const elemento = document.getElementById("printResumoPagamento");
  if (!elemento) return;

  try {
    const res = await fetch(`${API_URL}/comandas/${currentComandaNumero}/pagamentos`);
    const pagamentos = await res.json();

    const body = document.getElementById("printResumoPagamentoBody");
    const info = document.getElementById("printResumoInfo");
    const totalEl = document.getElementById("printResumoTotal");

    if (!body || !info || !totalEl) return;

    body.innerHTML = "";
    let total = 0;

    const agora = new Date();
    const nome = document.getElementById("nomeComanda")?.value || "";
    info.innerHTML = `<strong>COMANDA: ${currentComandaNumero}</strong><br>DATA: ${agora.toLocaleDateString()} ${agora.toLocaleTimeString()}` + (nome ? `<br>CLIENTE: ${nome}` : "");

    pagamentos.forEach(p => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td style="padding: 1mm 0; text-align: left;">${p.forma}</td><td style="text-align: right; padding: 1mm 0;">R$ ${formatarMoeda(p.valor)}</td>`;
      body.appendChild(tr);
      total += p.valor;
    });

    totalEl.innerText = `TOTAL PAGO: R$ ${formatarMoeda(total)}`;

    document.body.classList.add("printing-receipt");
    window.print();
    document.body.classList.remove("printing-receipt");

  } catch (err) {
    console.error("Erro ao imprimir resumo:", err);
  }
}

async function imprimirComandaAcao() {
  window.print();
}

async function imprimirDivisaoAcao() {
  window.print();
}

async function finalizarComandaModal() {
  if (saldoDevedorGlobal > 0.01) {
    alert("Saldo devedor pendente: R$ " + saldoDevedorGlobal.toFixed(2) + "\nRealize o pagamento total antes de finalizar.");
    return;
  }

  // Pergunta se deseja imprimir o comprovante
  if (confirm("Deseja imprimir o comprovante de pagamento?")) {
    await imprimirResumoPagamento();
  }

  const res = await fetch(
    `${API_URL}/comandas/${currentComandaNumero}/fechar`,
    { method: "POST" }
  );

  if (!res.ok) {
    let msg = "Erro ao fechar comanda";
    try {
      const data = await res.json();
      if (data.detail) msg = data.detail;
    } catch (e) { }
    alert(msg);
    return;
  }

  if (modalPagamento) modalPagamento.classList.add("hidden");
  if (modalComanda) modalComanda.classList.add("hidden");
  carregarDashboard();
}

// ===============================
// CADASTRO DE PRODUTOS (TELA)
// ===============================

async function carregarProdutosCadastrados() {
  const res = await fetch(`${API_URL}/produtos`);
  const produtos = await res.json();
  produtos.sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true }));
  if (tabelaProdutosModalBody) {
    tabelaProdutosModalBody.innerHTML = "";
    produtos.forEach(p => {
      const grupo = p.codigo.charAt(0);
      const tr = document.createElement("tr");
      tr.innerHTML = `
          <td style="padding: 10px; font-weight: bold; text-align: center;">${grupo}</td>
          <td>${p.codigo}</td>
          <td><input class="input-tabela-texto" value="${p.descricao}" onblur="editProduto(${p.id}, 'descricao', this.value)"></td>
          <td><input class="input-tabela-valor" value="${p.valor.toFixed(2)}" onblur="editProduto(${p.id}, 'valor', this.value)" style="width: 80px; text-align: right;"></td>
          <td style="text-align: center;"><input type="checkbox" ${p.ativo ? 'checked' : ''} onchange="editProduto(${p.id}, 'ativo', this.checked)"></td>
          <td style="text-align: center;">
            <button onclick="excluirProduto(${p.id})" style="background:#fee2e2; border:none; color:#ef4444; width:28px; height:28px; border-radius:50%; font-size:1.2rem; font-weight:bold; cursor:pointer; display:inline-flex; align-items:center; justify-content:center;" title="Excluir">×</button>
          </td>
        `;
      tabelaProdutosModalBody.appendChild(tr);
    });
  }
  produtosCache = produtos;
  filtrarERenderizarProdutosPage();
}

function filtrarERenderizarProdutosPage() {
  if (!tabelaProdutosPageBody) return;

  const fCod = prodPageCodigo ? prodPageCodigo.value.trim() : "";
  const fDesc = prodPageDescricao ? prodPageDescricao.value.toLowerCase().trim() : "";

  // Validação de código duplicado ao atingir 3 dígitos
  if (fCod.length === 3) {
    const existe = produtosCache.find(p => String(p.codigo) === fCod);
    if (existe) {
      alert(`O código ${fCod} já está em uso pelo produto: ${existe.descricao}`);
      if (prodPageCodigo) prodPageCodigo.value = "";
      filtrarERenderizarProdutosPage();
      return;
    }
  }

  let filtrados = produtosCache.filter(p => {
    const matchCod = !fCod || p.codigo.includes(fCod);
    const matchDesc = !fDesc || p.descricao.toLowerCase().includes(fDesc);
    return matchCod && matchDesc;
  });

  // Ordenação
  const { campo, direcao } = estadoOrdenacaoProdutos;
  filtrados.sort((a, b) => {
    let valA = a[campo];
    let valB = b[campo];

    if (campo === 'grupo') {
      valA = a.codigo.charAt(0);
      valB = b.codigo.charAt(0);
    }

    if (typeof valA === 'string') {
      return direcao === 'asc'
        ? valA.localeCompare(valB, undefined, { numeric: true })
        : valB.localeCompare(valA, undefined, { numeric: true });
    } else {
      return direcao === 'asc' ? valA - valB : valB - valA;
    }
  });

  renderizarTabelaProdutosPage(filtrados);
  atualizarIconesOrdenacao();
}

function limparFiltrosSessao() {
  if (prodPageCodigo) prodPageCodigo.value = "";
  if (prodPageDescricao) prodPageDescricao.value = "";
  if (prodPageValor) prodPageValor.value = "";
  filtrarERenderizarProdutosPage();
}

function atualizarIconesOrdenacao() {
  const { campo, direcao } = estadoOrdenacaoProdutos;
  const headers = document.querySelectorAll("#sectionProdutos thead th[onclick]");
  headers.forEach(th => {
    let texto = th.innerText.replace(/[↑↓↕️]/g, '').trim();
    if (th.getAttribute('onclick').includes(`'${campo}'`)) {
      th.innerHTML = `${texto} ${direcao === 'asc' ? '↑' : '↓'}`;
    } else {
      th.innerHTML = texto;
    }
  });
}

function ordenarProdutos(campo) {
  if (estadoOrdenacaoProdutos.campo === campo) {
    estadoOrdenacaoProdutos.direcao = estadoOrdenacaoProdutos.direcao === 'asc' ? 'desc' : 'asc';
  } else {
    estadoOrdenacaoProdutos.campo = campo;
    estadoOrdenacaoProdutos.direcao = 'asc';
  }
  filtrarERenderizarProdutosPage();
}

function renderizarTabelaProdutosPage(produtos) {
  if (!tabelaProdutosPageBody) return;
  tabelaProdutosPageBody.innerHTML = "";
  produtos.forEach(p => {
    const grupo = p.codigo.charAt(0);
    const tr = document.createElement("tr");
    tr.style.borderBottom = "1px solid #f1f5f9";
    tr.innerHTML = `
        <td style="padding: 15px; text-align: center; font-weight: bold; color: #3b82f6;">${grupo}</td>
        <td style="padding: 15px;">${p.codigo}</td>
        <td style="padding: 15px;"><input class="input-tabela-texto" value="${p.descricao}" onblur="editProduto(${p.id}, 'descricao', this.value)" style="width: 100%; border:none; background:transparent;"></td>
        <td style="padding: 15px; text-align: right;"><input class="input-tabela-valor" value="${p.valor.toFixed(2)}" onblur="editProduto(${p.id}, 'valor', this.value)" style="width: 80px; text-align: right; border:none; background:transparent;"></td>
        <td style="padding: 15px; text-align: center;"><input type="checkbox" ${p.ativo ? 'checked' : ''} onchange="editProduto(${p.id}, 'ativo', this.checked)"></td>
        <td style="padding: 15px; text-align: center;">
          <button onclick="excluirProduto(${p.id})" style="background:#fee2e2; border:none; color:#ef4444; width:28px; height:28px; border-radius:50%; font-size:1.2rem; font-weight:bold; cursor:pointer; display:inline-flex; align-items:center; justify-content:center;" title="Excluir">×</button>
        </td>
      `;
    tabelaProdutosPageBody.appendChild(tr);
  });
}

async function salvarNovoProduto() {
  const cod = novoCodigoInput ? novoCodigoInput.value.trim() : "";
  const desc = novaDescricaoInput ? novaDescricaoInput.value.trim() : "";
  const val = parseFloat(valorNovoProdutoInput ? valorNovoProdutoInput.value : 0);

  if (!/^\d{3}$/.test(cod)) {
    return alert("O código do produto deve ter exatamente 3 dígitos numéricos (ex: 001, 123)");
  }

  if (!cod || !desc || isNaN(val)) return alert("Dados inválidos");
  const res = await fetch(`${API_URL}/produtos/`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ codigo: cod, descricao: desc, valor: val })
  });
  if (res.ok) {
    if (novoCodigoInput) novoCodigoInput.value = "";
    if (novaDescricaoInput) novaDescricaoInput.value = "";
    if (valorNovoProdutoInput) valorNovoProdutoInput.value = "";
    await carregarProdutosCadastrados();
    await carregarProdutosBase();
  }
}

async function salvarNovoProdutoSessao() {
  const cod = prodPageCodigo ? prodPageCodigo.value.trim() : "";
  const desc = prodPageDescricao ? prodPageDescricao.value.trim() : "";
  const val = parseFloat(prodPageValor ? prodPageValor.value : 0);

  if (!/^\d{3}$/.test(cod)) {
    alert("O código do produto deve ter exatamente 3 dígitos numéricos.");
    setTimeout(() => prodPageCodigo.focus(), 10);
    return;
  }

  if (!cod || !desc || isNaN(val)) return alert("Dados obrigatórios faltando");

  const res = await fetch(`${API_URL}/produtos/`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ codigo: cod, descricao: desc, valor: val })
  });
  if (res.ok) {
    prodPageCodigo.value = "";
    prodPageDescricao.value = "";
    prodPageValor.value = "";
    await carregarProdutosCadastrados();
    await carregarProdutosBase();
    prodPageCodigo.focus();
  } else {
    const err = await res.json();
    alert(err.detail || "Erro ao salvar");
  }
}

function alternarParaProdutos() {
  sectionComandas.classList.add("hidden");
  sectionProdutos.classList.remove("hidden");
  if (document.getElementById("sectionColaboradores")) document.getElementById("sectionColaboradores").classList.add("hidden");
  if (document.getElementById("sectionFinanceiro")) document.getElementById("sectionFinanceiro").classList.add("hidden");
  if (document.getElementById("sectionRelatorios")) document.getElementById("sectionRelatorios").classList.add("hidden");
  if (document.getElementById("sectionFluxoCaixa")) document.getElementById("sectionFluxoCaixa").classList.add("hidden");
  if (document.getElementById("sectionFechamento")) document.getElementById("sectionFechamento").classList.add("hidden");

  navDashboard.classList.remove("active");
  navProdutosSessao.classList.add("active");
  if (document.getElementById("navFinanceiro")) document.getElementById("navFinanceiro").classList.remove("active");
  if (document.getElementById("navRelatorios")) document.getElementById("navRelatorios").classList.remove("active");
  if (document.getElementById("navFechamento")) document.getElementById("navFechamento").classList.remove("active");

  carregarProdutosCadastrados();
}

function alternarParaDashboard() {
  sectionProdutos.classList.add("hidden");
  sectionComandas.classList.remove("hidden");
  if (document.getElementById("sectionColaboradores")) document.getElementById("sectionColaboradores").classList.add("hidden");
  if (document.getElementById("sectionFinanceiro")) document.getElementById("sectionFinanceiro").classList.add("hidden");
  if (document.getElementById("sectionRelatorios")) document.getElementById("sectionRelatorios").classList.add("hidden");
  if (document.getElementById("sectionFluxoCaixa")) document.getElementById("sectionFluxoCaixa").classList.add("hidden");
  if (document.getElementById("sectionFechamento")) document.getElementById("sectionFechamento").classList.add("hidden");

  navProdutosSessao.classList.remove("active");
  navDashboard.classList.add("active");
  if (document.getElementById("navColaboradores")) document.getElementById("navColaboradores").classList.remove("active");
  if (document.getElementById("navFinanceiro")) document.getElementById("navFinanceiro").classList.remove("active");
  if (document.getElementById("navRelatorios")) document.getElementById("navRelatorios").classList.remove("active");
  if (document.getElementById("navFechamento")) document.getElementById("navFechamento").classList.remove("active");

  carregarDashboard();
}

function alternarParaFechamento() {
  // Esconde todas as outras seções conhecidas
  sectionComandas.classList.add("hidden");
  sectionProdutos.classList.add("hidden");
  if (document.getElementById("sectionColaboradores")) document.getElementById("sectionColaboradores").classList.add("hidden");
  if (document.getElementById("sectionFinanceiro")) document.getElementById("sectionFinanceiro").classList.add("hidden");
  if (document.getElementById("sectionRelatorios")) document.getElementById("sectionRelatorios").classList.add("hidden");
  if (document.getElementById("sectionFluxoCaixa")) document.getElementById("sectionFluxoCaixa").classList.add("hidden");

  const secFechamento = document.getElementById("sectionFechamento");
  if (secFechamento) {
    secFechamento.classList.remove("hidden");
  } else {
    console.error("Elemento sectionFechamento não encontrado!");
  }

  // Atualiza Menu
  navDashboard.classList.remove("active");
  navProdutosSessao.classList.remove("active");
  if (document.getElementById("navColaboradores")) document.getElementById("navColaboradores").classList.remove("active");
  if (document.getElementById("navFinanceiro")) document.getElementById("navFinanceiro").classList.remove("active");
  if (document.getElementById("navRelatorios")) document.getElementById("navRelatorios").classList.remove("active");
  const navFC = document.getElementById("navFluxoCaixa");
  if (navFC) navFC.classList.remove("active");

  const nFechamento = document.getElementById("navFechamento");
  if (nFechamento) nFechamento.classList.add("active");
}

async function imprimirFechamentoFinal() {
  const isVendas = document.getElementById("checkPrintVendas").checked;
  const isPagamentos = document.getElementById("checkPrintPagamentos").checked;
  const isSistema = document.getElementById("checkPrintRecebimentosSistema").checked;
  const isManual = document.getElementById("checkPrintRecebimentosManual").checked;

  try {
    const now = new Date();
    const hoje = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, '0') + "-" + String(now.getDate()).padStart(2, '0');
    const res = await fetch(`${API_URL}/relatorios/vendas?data_inicio=${hoje}T00:00:00&data_fim=${hoje}T23:59:59`);
    const data = await res.json();

    const printData = document.getElementById("printFechamentoData");
    if (printData) printData.innerText = `DATA: ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR")}`;

    const blocoVendas = document.getElementById("printBlocoVendas");
    const bodyVendas = document.getElementById("printBodyVendas");
    if (bodyVendas) {
      blocoVendas.style.display = isVendas ? "block" : "none";
      bodyVendas.innerHTML = "";
      if (isVendas) {
        data.geral.forEach(v => {
          const tr = document.createElement("tr");
          tr.innerHTML = `<td style="padding: 2px 0;">${v.descricao}</td><td style="text-align: right;">${v.total_qtd}</td>`;
          bodyVendas.appendChild(tr);
        });
      }
    }

    const blocoPagamentos = document.getElementById("printBlocoPagamentos");
    const bodyPagamentos = document.getElementById("printBodyPagamentos");
    if (bodyPagamentos) {
      blocoPagamentos.style.display = isPagamentos ? "block" : "none";
      bodyPagamentos.innerHTML = "";
      if (isPagamentos) {
        data.saidas.forEach(s => {
          const tr = document.createElement("tr");
          tr.innerHTML = `<td style="padding: 2px 0;">${s.fornecedor}</td><td style="text-align: right;">R$ ${formatarMoeda(s.total)}</td>`;
          bodyPagamentos.appendChild(tr);
        });
      }
    }

    const blocoSistema = document.getElementById("printBlocoRecebimentosSistema");
    const bodySistema = document.getElementById("printBodyRecebimentosSistema");
    if (bodySistema) {
      blocoSistema.style.display = isSistema ? "block" : "none";
      bodySistema.innerHTML = "";
      if (isSistema) {
        data.fechamento.forEach(f => {
          const tr = document.createElement("tr");
          tr.innerHTML = `<td style="padding: 2px 0;">${f.forma}</td><td style="text-align: right;">R$ ${formatarMoeda(f.total)}</td>`;
          bodySistema.appendChild(tr);
        });
      }
    }

    const blocoManual = document.getElementById("printBlocoRecebimentosManual");
    const bodyManual = document.getElementById("printBodyRecebimentosManual");
    if (bodyManual) {
      blocoManual.style.display = isManual ? "block" : "none";
      bodyManual.innerHTML = "";
      if (isManual) {
        // Soma todos os valores de todas as linhas de máquinas
        let valCred = 0, valDeb = 0, valPix = 0;

        document.querySelectorAll(".linha-maquina").forEach(row => {
          valCred += parseMoedaInput(row.querySelector(".f-credito").value);
          valDeb += parseMoedaInput(row.querySelector(".f-debito").value);
          valPix += parseMoedaInput(row.querySelector(".f-pix").value);
        });

        // Dinheiro e Voucher vêm dos campos fixos
        const dinheiroInput = document.getElementById("fechamentoDinheiroInput");
        const voucherInput = document.getElementById("fechamentoVoucherInput");
        const valDin = dinheiroInput ? parseMoedaInput(dinheiroInput.value) : 0;
        const valVou = voucherInput ? parseMoedaInput(voucherInput.value) : 0;

        const formas = [
          { f: "CARTÃO CRÉDITO", v: valCred },
          { f: "CARTÃO DÉBITO", v: valDeb },
          { f: "PIX", v: valPix },
          { f: "DINHEIRO", v: valDin },
          { f: "VOUCHER", v: valVou }
        ];

        formas.forEach(item => {
          if (item.v > 0) {
            const tr = document.createElement("tr");
            tr.innerHTML = `<td style="padding: 2px 0;">${item.f}</td><td style="text-align: right;">R$ ${formatarMoeda(item.v)}</td>`;
            bodyManual.appendChild(tr);
          }
        });
      }
    }

    document.body.classList.add("printing-closure");
    setTimeout(() => {
      window.print();
      document.body.classList.remove("printing-closure");
      const mImpressao = document.getElementById("modalImpressaoFechamento");
      if (mImpressao) mImpressao.classList.add("hidden");
    }, 500);
  } catch (err) {
    console.error("Erro no fechamento:", err);
    alert("Erro ao preparar o fechamento.");
  }
}

async function editProduto(id, campo, novoValor) {
  const p = produtosCache.find(x => x.id === id);
  if (!p) return;
  const atualizado = { ...p };
  if (campo === 'valor') atualizado.valor = parseFloat(novoValor);
  else if (campo === 'ativo') atualizado.ativo = novoValor;
  else if (campo === 'codigo') {
    if (!/^\d{3}$/.test(novoValor)) {
      alert("O código deve ter exatamente 3 dígitos.");
      carregarProdutosCadastrados();
      return;
    }
    atualizado.codigo = novoValor;
  } else atualizado[campo] = novoValor;

  await fetch(`${API_URL}/produtos/${id}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(atualizado)
  });
  await carregarProdutosCadastrados();
  await carregarProdutosBase();
}

async function excluirProduto(id) {
  if (!confirm("Tem certeza que deseja excluir este produto permanentemente?")) return;
  const res = await fetch(`${API_URL}/produtos/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json();
    alert(err.detail || "Erro ao excluir produto");
  } else {
    await carregarProdutosCadastrados();
    await carregarProdutosBase();
  }
}

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
    pessoasComanda.oninput = () => { if (qtdPessoasInput) qtdPessoasInput.value = pessoasComanda.value; atualizarDivisaoTotal(); };
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

configListeners();
init();

let produtoSelecionado = null;
let produtosCache = [];
let estadoOrdenacaoProdutos = { campo: 'codigo', direcao: 'asc' };

window.removerPagamentoModal = removerPagamentoModal;
window.editProduto = editProduto;
// ===============================
// LÓGICA DE MÁQUINAS (FECHAMENTO)
// ===============================
function formatarCampoMoeda(input) {
  let valor = input.value.replace(/\D/g, "");
  valor = (parseFloat(valor) / 100).toFixed(2);
  if (isNaN(valor)) valor = "0.00";

  input.value = "R$ " + formatarMoeda(parseFloat(valor));
}

function parseMoedaInput(texto) {
  if (!texto) return 0;
  let limpo = texto.replace("R$ ", "").replace(/\./g, "").replace(",", ".");
  return parseFloat(limpo) || 0;
}

function adicionarLinhaFechamento(label = "", c = 0, d = 0, p = 0) {
  const tbody = document.getElementById("tbodyMaquinasFechamento");
  if (!tbody) return;

  const tr = document.createElement("tr");
  tr.className = "linha-maquina";
  tr.style.borderBottom = "1px solid #f1f5f9";

  tr.innerHTML = `
    <td style="padding: 10px;"><input type="text" class="f-label" value="${label}" placeholder="Ex: Cielo, Stone..." style="width:100%; border:1px solid #e2e8f0; padding:8px; border-radius:6px; font-weight:700;"></td>
    <td style="padding: 10px;"><input type="text" class="f-moeda f-credito" value="${c ? "R$ " + formatarMoeda(c) : ""}" placeholder="R$ 0,00" style="width:100%; border:1px solid #e2e8f0; padding:8px; border-radius:6px; font-weight:700; text-align:right;"></td>
    <td style="padding: 10px;"><input type="text" class="f-moeda f-debito" value="${d ? "R$ " + formatarMoeda(d) : ""}" placeholder="R$ 0,00" style="width:100%; border:1px solid #e2e8f0; padding:8px; border-radius:6px; font-weight:700; text-align:right;"></td>
    <td style="padding: 10px;"><input type="text" class="f-moeda f-pix" value="${p ? "R$ " + formatarMoeda(p) : ""}" placeholder="R$ 0,00" style="width:100%; border:1px solid #e2e8f0; padding:8px; border-radius:6px; font-weight:700; text-align:right;"></td>
    <td style="padding: 10px; text-align:center;"><button class="btn-remove-linha-fech" style="background:#fee2e2; color:#ef4444; border:none; border-radius:50%; width:28px; height:28px; cursor:pointer;" title="Remover">×</button></td>
  `;

  tbody.appendChild(tr);

  // Vincular máscara, cálculos e navegação por Enter
  const inputs = tr.querySelectorAll("input");
  inputs.forEach((inp, idx) => {
    if (inp.classList.contains("f-moeda")) {
      // Aplica máscara a cada digitação
      inp.addEventListener("input", () => {
        formatarCampoMoeda(inp);
        atualizarTotaisFechamento();
      });

      // Garante formatação ao sair do campo
      inp.addEventListener("blur", () => {
        if (inp.value && inp.value.trim() !== "") {
          formatarCampoMoeda(inp);
        }
      });

      // Ao focar, seleciona tudo para facilitar edição
      inp.addEventListener("focus", () => {
        inp.select();
      });
    }

    inp.onkeydown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const todosInps = Array.from(document.querySelectorAll("#tbodyMaquinasFechamento input"));
        const atualIdx = todosInps.indexOf(inp);

        if (atualIdx < todosInps.length - 1) {
          todosInps[atualIdx + 1].focus();
          todosInps[atualIdx + 1].select();
        } else {
          // Ir para o campo de dinheiro
          const dinheiroInput = document.getElementById("fechamentoDinheiroInput");
          if (dinheiroInput) dinheiroInput.focus();
        }
      }
    };
  });

  tr.querySelector(".btn-remove-linha-fech").onclick = () => {
    tr.remove();
    atualizarTotaisFechamento();
  };

  atualizarTotaisFechamento();
}

function atualizarTotaisFechamento() {
  let sc = 0, sd = 0, sp = 0;
  document.querySelectorAll(".linha-maquina").forEach(row => {
    sc += parseMoedaInput(row.querySelector(".f-credito").value);
    sd += parseMoedaInput(row.querySelector(".f-debito").value);
    sp += parseMoedaInput(row.querySelector(".f-pix").value);
  });

  // Dinheiro e Voucher vêm dos campos fixos
  const dinheiroInput = document.getElementById("fechamentoDinheiroInput");
  const voucherInput = document.getElementById("fechamentoVoucherInput");
  const sdi = dinheiroInput ? parseMoedaInput(dinheiroInput.value) : 0;
  const sv = voucherInput ? parseMoedaInput(voucherInput.value) : 0;

  const tC = document.getElementById("totalFechamentoCredito");
  const tD = document.getElementById("totalFechamentoDebito");
  const tP = document.getElementById("totalFechamentoPix");
  const tG = document.getElementById("totalFechamentoGeral");

  if (tC) tC.innerText = `R$ ${formatarMoeda(sc)}`;
  if (tD) tD.innerText = `R$ ${formatarMoeda(sd)}`;
  if (tP) tP.innerText = `R$ ${formatarMoeda(sp)}`;

  // Total geral = maquininhas + dinheiro + voucher
  const totalGeral = sc + sd + sp + sdi + sv;
  if (tG) tG.innerText = `R$ ${formatarMoeda(totalGeral)}`;
}

// Inicialização e Eventos
document.addEventListener("DOMContentLoaded", () => {
  const btnAdd = document.getElementById("btnAdicionarMaquina");
  if (btnAdd) btnAdd.onclick = () => adicionarLinhaFechamento();

  // Vincular campos de dinheiro e voucher fixos
  const dinheiroInput = document.getElementById("fechamentoDinheiroInput");
  const voucherInput = document.getElementById("fechamentoVoucherInput");

  if (dinheiroInput) {
    dinheiroInput.addEventListener("input", () => {
      formatarCampoMoeda(dinheiroInput);
      atualizarTotaisFechamento();
    });
    dinheiroInput.addEventListener("focus", () => dinheiroInput.select());
    dinheiroInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (voucherInput) voucherInput.focus();
      }
    });
  }

  if (voucherInput) {
    voucherInput.addEventListener("input", () => {
      formatarCampoMoeda(voucherInput);
      atualizarTotaisFechamento();
    });
    voucherInput.addEventListener("focus", () => voucherInput.select());
    voucherInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const btnImprimir = document.getElementById("btnAbrirModalImpressaoFechamento");
        if (btnImprimir) btnImprimir.focus();
      }
    });
  }

  // Adiciona duas linhas por padrão
  if (document.getElementById("tbodyMaquinasFechamento")) {
    adicionarLinhaFechamento("MÁQUINA 01");
    adicionarLinhaFechamento("MÁQUINA 02");
  }
});

// ===============================
// VENDAS HOJE (SIDEBAR)
// ===============================
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

    const res = await fetch(`${API_URL}/relatorios/vendas?data_inicio=${hojeInicio}&data_fim=${hojeFim}`);
    const resposta = await res.json();

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
      tr.style.borderBottom = "1px solid #f1f5f9";
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

window.removerItemUnico = removerItemUnico;