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

  setInterval(() => {
    if ((!modalComanda || modalComanda.classList.contains("hidden")) &&
      (!modalPagamento || modalPagamento.classList.contains("hidden")) &&
      (!modalCadastroProduto || modalCadastroProduto.classList.contains("hidden"))) {
      carregarDashboard();
    }
  }, 10000);
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
  if (statsOcupadas) statsOcupadas.innerText = abertas.length;
  if (statsLivres) statsLivres.innerText = Math.max(0, TOTAL_COMANDAS - abertas.length);
}

const btnToggleSidebar = document.getElementById("btnToggleSidebar");

if (btnToggleSidebar && sidebar) {
  btnToggleSidebar.onclick = () => {
    const isCollapsed = sidebar.classList.toggle("collapsed");
    btnToggleSidebar.innerText = isCollapsed ? ">" : "<";
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
    if (buscaCodigo) {
      setTimeout(() => {
        buscaCodigo.focus();
        buscaCodigo.select();
      }, 100);
    }
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
    tr.innerHTML = `
      <td style="padding: 8px;">${item.codigo}</td>
      <td>${item.descricao}</td>
      <td style="text-align: center;">${item.total_quantidade}</td>
      <td style="text-align: center;">${pagoVisual.toFixed(0)}</td>
      <td style="text-align: center;" class="qtd-disponivel-modal">${disponivelParaSelecionar}</td>
      <td style="text-align: center;">
        <input type="number" value="0" min="0" max="${disponivelParaSelecionar}" class="qtd-pagar-item" style="width: 50px; text-align: center; margin: 0;" ${disponivelParaSelecionar <= 0 ? 'disabled' : ''}>
      </td>
      <td>R$ ${formatarMoeda(item.valor)}</td>
      <td class="subtotal-item">R$ 0,00</td>
    `;

    const input = tr.querySelector(".qtd-pagar-item");
    const disponivelEl = tr.querySelector(".qtd-disponivel-modal");

    if (input) {
      input.oninput = () => {
        let val = parseInt(input.value) || 0;
        if (val > disponivelParaSelecionar) val = disponivelParaSelecionar;
        if (val < 0) val = 0;
        input.value = val;
        item.selecionado = val;

        // Atualiza Restante Visualmente (Disponível - Selecionado Agora)
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

  // if (valorPagamentoInput) {
  //   setTimeout(() => { valorPagamentoInput.focus(); valorPagamentoInput.select(); }, 100);
  // }
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
      btnFinalizarComandaModal.innerText = "Finalizar Comanda (F1)";
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
    if (valorPagamentoInput) { valorPagamentoInput.focus(); valorPagamentoInput.select(); }
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

async function finalizarComandaModal() {
  if (saldoDevedorGlobal > 0.01) {
    alert("Saldo devedor pendente: R$ " + saldoDevedorGlobal.toFixed(2) + "\nRealize o pagamento total antes de finalizar.");
    return;
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
  navDashboard.classList.remove("active");
  navProdutosSessao.classList.add("active");
  carregarProdutosCadastrados();
}

function alternarParaDashboard() {
  sectionProdutos.classList.add("hidden");
  sectionComandas.classList.remove("hidden");
  navProdutosSessao.classList.remove("active");
  navDashboard.classList.add("active");
  carregarDashboard();
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
  if (nomeComanda) nomeComanda.onblur = atualizarComandaAPI;
  if (telefoneComanda) telefoneComanda.onblur = atualizarComandaAPI;
  if (pessoasComanda) pessoasComanda.oninput = () => { if (qtdPessoasInput) qtdPessoasInput.value = pessoasComanda.value; atualizarDivisaoTotal(); };
  if (buscaCodigo) {
    buscaCodigo.oninput = filtrarProdutosModal;
    buscaCodigo.onkeydown = e => { if (e.key === "Enter") adicionarItemComanda(); };
  }
  if (buscaDescricao) {
    buscaDescricao.oninput = filtrarProdutosModal;
    buscaDescricao.onkeydown = e => { if (e.key === "Enter") adicionarItemComanda(); };
  }
  if (qtdProduto) qtdProduto.onkeydown = e => { if (e.key === "Enter") adicionarItemComanda(); };
  if (valorProduto) valorProduto.onkeydown = e => { if (e.key === "Enter") adicionarItemComanda(); };

  if (btnDividirItemModal) btnDividirItemModal.onclick = abrirModalDividirItem;
  if (btnImprimirModal) btnImprimirModal.onclick = () => window.print();

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
      if (btnLancarPagamentoModal) btnLancarPagamentoModal.focus();
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
      const isCollapsed = sidebarRight.classList.toggle("collapsed");
      btnToggleRightSidebar.innerText = isCollapsed ? "<" : ">";
    };
  }
}

document.onkeydown = (e) => {
  if (e.key === "Escape") {
    if (modalDividirItem && !modalDividirItem.classList.contains("hidden")) modalDividirItem.classList.add("hidden");
    else if (modalPagamento && !modalPagamento.classList.contains("hidden")) modalPagamento.classList.add("hidden");
    else if (modalComanda && !modalComanda.classList.contains("hidden")) btnFecharModalComanda.onclick();
    else if (modalCadastroProduto && !modalCadastroProduto.classList.contains("hidden")) modalCadastroProduto.classList.add("hidden");
  }
  if (modalComanda && !modalComanda.classList.contains("hidden") && modalPagamento && modalPagamento.classList.contains("hidden")) {
    if (e.key === "F1") { e.preventDefault(); abrirModalPagamento(); }
    if (e.key === "F2") { e.preventDefault(); window.print(); }
  }
  if (modalPagamento && !modalPagamento.classList.contains("hidden")) {
    if (e.key === "F1" && btnFinalizarComandaModal && !btnFinalizarComandaModal.disabled) { e.preventDefault(); finalizarComandaModal(); }
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
window.removerItemUnico = removerItemUnico;