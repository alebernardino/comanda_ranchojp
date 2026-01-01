// pega numero da comanda da URL
const params = new URLSearchParams(window.location.search);
const numero = params.get("numero");

const qtdPessoasInput = document.getElementById("qtdPessoas");
const valorPorPessoaDiv = document.getElementById("valorPorPessoa");
const btnDividirItem = document.getElementById("btnDividirItem");
const modalDividirItem = document.getElementById("modalDividirItem");
const tbodyDivisaoItens = document.getElementById("tbodyDivisaoItens");
const btnFecharModalItem = document.getElementById("btnFecharModalItem");
const btnAdicionarAoPagamento = document.getElementById("btnAdicionarAoPagamento");
const totalSelecionadoItemEl = document.getElementById("totalSelecionadoItem");
const btnConsiderarSelecaoItem = document.getElementById("btnConsiderarSelecaoItem");

// Carrega seleção acumulada do sessionStorage para persistir entre páginas
let itensSelecionadosAcumulados = JSON.parse(sessionStorage.getItem(`comanda_${numero}_selecao`) || "[]");
if (itensSelecionadosAcumulados.length === 0) itensSelecionadosAcumulados = null;


let totalComandaGlobal = 0;

if (!numero) {
  alert("Comanda não informada");
  window.location.href = "index.html";
}

// Função para formatar valores monetários no padrão brasileiro (ponto para milhar, vírgula para decimal)
function formatarValor(valor) {
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const titulo = document.getElementById("tituloComanda");
const nomeComanda = document.getElementById("nomeComanda");
const telefoneComanda = document.getElementById("telefoneComanda");

async function carregarComanda() {
  const res = await fetch(`${API_URL}/comandas/${numero}`);

  if (!res.ok) {
    alert("Comanda não encontrada");
    window.location.href = "index.html";
    return;
  }

  const comanda = await res.json();
  titulo.innerText = `Comanda ${comanda.numero}`;
  nomeComanda.value = comanda.nome || "";
  telefoneComanda.value = comanda.telefone || "";
}

// Função para atualizar nome e telefone da comanda
async function atualizarComanda() {
  const payload = {
    numero: parseInt(numero),
    nome: nomeComanda.value.trim() || null,
    telefone: telefoneComanda.value.trim() || null
  };

  try {
    const res = await fetch(`${API_URL}/comandas/${numero}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      console.error("Erro ao atualizar comanda");
    }
  } catch (err) {
    console.error("Erro ao salvar dados da comanda:", err);
  }
}

// Auto-save quando o usuário sair dos campos
nomeComanda.addEventListener("blur", atualizarComanda);
telefoneComanda.addEventListener("blur", atualizarComanda);

carregarComanda();

const buscaCodigo = document.getElementById("buscaCodigo");
const buscaDescricao = document.getElementById("buscaDescricao");
const listaProdutos = document.getElementById("listaProdutos");
const qtdProduto = document.getElementById("qtdProduto");
const valorProduto = document.getElementById("valorProduto");
const btnAddItem = document.getElementById("btnAddItem");
const tabelaItensBody = document.querySelector("#tabelaItens tbody");
const totalComandaDiv = document.getElementById("totalComanda");
const btnSair = document.getElementById("btnSair");
const btnImprimir = document.getElementById("btnImprimir");
const btnPagamento = document.getElementById("btnPagamento");
const containerComanda = document.getElementById("containerComanda");

const codigoParam = params.get("codigo");

async function init() {
  await carregarProdutos();

  if (codigoParam) {
    buscaCodigo.value = codigoParam;
    filtrarProdutos();
  }
}

init();


let produtoSelecionado = null;
let produtos = [];

btnSair.addEventListener("click", () => {
  // if (confirm("Deseja sair da comanda?")) {
  window.location.href = "index.html";
  // }
});

btnImprimir.addEventListener("click", () => {
  window.print();
});

btnPagamento.addEventListener("click", () => {
  // if (!confirm("Ir para pagamento da comanda?")) return;
  // versão simples: redireciona
  window.location.href = `pagamento.html?numero=${numero}`;
});

// Tecla de atalho global para retorno ao index se necessário (já tratado nos botões)



async function carregarProdutos() {
  const res = await fetch(`${API_URL}/produtos/`);
  produtos = await res.json();
  produtos.sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true }));
  renderizarProdutos(produtos);
}



function renderizarProdutos(lista) {
  listaProdutos.innerHTML = "";

  lista.forEach(p => {
    const div = document.createElement("div");
    div.className = "produto-item";
    div.innerHTML = `
      <span class="produto-cod">${p.codigo}</span>
      <span class="produto-desc">${p.descricao}</span>
      <span class="produto-valor">R$ ${formatarValor(p.valor)}</span>
    `;
    listaProdutos.appendChild(div);
  });
}

function filtrarProdutos() {
  const codigo = buscaCodigo.value.trim();
  const descricao = buscaDescricao.value.trim().toLowerCase();

  let filtrados = produtos;

  if (codigo) {
    filtrados = filtrados.filter(p =>
      String(p.codigo).startsWith(codigo)
    );
  }

  if (descricao) {
    filtrados = filtrados.filter(p =>
      p.descricao.toLowerCase().startsWith(descricao)
    );
  }

  renderizarProdutos(filtrados);

  // Auto-fill se houver match exato e o foco estiver no código
  if (document.activeElement === buscaCodigo) {
    const exactMatch = produtos.find(p => String(p.codigo) === codigo);

    if (exactMatch) {
      produtoSelecionado = exactMatch;
      buscaDescricao.value = exactMatch.descricao;
      valorProduto.value = formatarValor(exactMatch.valor);
      qtdProduto.focus(); // Jump to Qtd
    } else {
      // Se digitou algo mas não é código válido, limpa
      produtoSelecionado = null;
      buscaDescricao.value = "";
      valorProduto.value = "";
    }
  }

  // Se não achou nada na lista e tem código digitado, mostra opção de add
  if (filtrados.length === 0 && codigo) {
    mostrarOpcaoAdicionarProduto(codigo);
  }
}

function selecionarProduto(produto) {
  produtoSelecionado = produto;

  buscaCodigo.value = produto.codigo;
  buscaDescricao.value = produto.descricao;
  valorProduto.value = formatarValor(produto.valor);

  qtdProduto.value = "";
  qtdProduto.focus();

  // listaProdutos.innerHTML = "";
  renderizarProdutos([produto]);
}

function mostrarOpcaoAdicionarProduto(codigo) {
  listaProdutos.innerHTML = "";

  const div = document.createElement("div");
  div.className = "produto-nao-encontrado";

  div.innerHTML = `
    Produto não encontrado
    <button id="btnAddProduto">+</button>
  `;

  listaProdutos.appendChild(div);

  document.getElementById("btnAddProduto")
    .addEventListener("click", () => {
      window.location.href = `cadastro_produto.html?codigo=${codigo}&numero=${numero}`;
    });
}

async function adicionarItem() {
  if (!produtoSelecionado) {
    alert("Selecione um produto");
    return;
  }

  // Se quantidade vazia, assume 1
  if (!qtdProduto.value) {
    qtdProduto.value = "1";
  }

  const qtd = Number(qtdProduto.value);
  const valorStr = valorProduto.value.replace(",", ".");
  const valor = Number(valorStr);

  if (isNaN(qtd) || qtd <= 0) {
    alert("Quantidade inválida");
    return;
  }

  if (isNaN(valor) || valor <= 0) {
    alert("Valor inválido");
    return;
  }

  const payload = {
    codigo: String(produtoSelecionado.codigo),
    descricao: String(produtoSelecionado.descricao),
    quantidade: Number(qtd),
    valor: Number(valor)
  };

  console.log("ENVIANDO ITEM:", payload);

  const res = await fetch(`${API_URL}/comandas/${numero}/itens`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    alert("Erro ao adicionar item");
    return;
  }

  // limpa campos e volta para o código
  buscaCodigo.value = "";
  buscaDescricao.value = "";
  qtdProduto.value = "";
  valorProduto.value = "";
  produtoSelecionado = null;

  buscaCodigo.focus();

  await carregarItensComanda();
}

qtdProduto.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    adicionarItem();
  }
});

btnAddItem.addEventListener("click", adicionarItem);

valorProduto.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    adicionarItem();
  }
});






const itensComandaDiv = document.getElementById("itensComanda");

async function carregarItensComanda() {
  const res = await fetch(`${API_URL}/comandas/${numero}/itens`);

  if (!res.ok) {
    console.error("Erro ao carregar itens da comanda");
    return;
  }

  const itens = await res.json();
  renderizarTabelaItens(itens); // ✅ USAR A TABELA
}


async function removerItensProduto(ids) {
  if (!Array.isArray(ids) || ids.length === 0) {
    console.error("IDs inválidos para remoção", ids);
    return;
  }

  if (!confirm("Remover este produto da comanda?")) return;

  for (const id of ids) {
    const res = await fetch(`${API_URL}/itens/${id}`, {
      method: "DELETE"
    });

    if (!res.ok) {
      alert("Erro ao remover item");
      return;
    }
  }

  await carregarItensComanda();
}

async function adicionarMaisItem(item) {
  const res = await fetch(`${API_URL}/comandas/${numero}/itens`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      codigo: item.codigo,
      descricao: item.descricao,
      quantidade: 1,
      valor: item.valor
    })
  });

  if (!res.ok) {
    alert("Erro ao adicionar item");
    return;
  }

  await carregarItensComanda();
}

async function removerUmItem(item) {
  // Encontra o primeiro item que tenha quantidade > 1 para decrementar
  const itemParaDecrementar = item.itensOriginais.find(i => i.quantidade > 1);

  if (itemParaDecrementar) {
    const novaQtd = itemParaDecrementar.quantidade - 1;
    await fetch(`${API_URL}/itens/${itemParaDecrementar.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        codigo: String(itemParaDecrementar.codigo),
        descricao: String(itemParaDecrementar.descricao),
        quantidade: novaQtd,
        valor: itemParaDecrementar.valor
      })
    });
  } else {
    // Se todos têm quantidade 1, remove o primeiro ID encontrado
    const idParaRemover = item.ids[0];
    if (!idParaRemover) return;

    await fetch(`${API_URL}/itens/${idParaRemover}`, {
      method: "DELETE"
    });
  }

  await carregarItensComanda();
}

function renderizarTabelaItens(itens) {
  tabelaItensBody.innerHTML = "";

  const mapa = {};
  const ordem = [];

  itens.forEach(i => {
    if (!mapa[i.codigo]) {
      mapa[i.codigo] = {
        codigo: i.codigo,
        descricao: i.descricao,
        valor: i.valor,
        quantidade: i.quantidade,
        subtotal: i.subtotal,
        ids: [i.id],
        itensOriginais: [i] // 🔥 Store raw items
      };
      ordem.push(i.codigo);
      ordem.sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));
    } else {
      mapa[i.codigo].quantidade += i.quantidade;
      mapa[i.codigo].subtotal += i.subtotal;
      mapa[i.codigo].ids.push(i.id);
      mapa[i.codigo].itensOriginais.push(i); // 🔥 Store raw items
    }
  });

  let total = 0;

  ordem.forEach(codigo => {
    const item = mapa[codigo];
    total += item.subtotal;

    const tr = document.createElement("tr");

    tr.innerHTML = `
        <td>${item.codigo}</td>
        <td>${item.descricao}</td>
        <td>
          <div class="qtd-container">
            <button class="btn-qtd btn-menos">-</button>
            <button class="btn-qtd btn-mais">+</button>
            <span class="qtd-item">${item.quantidade}</span>
            <button class="btn-remover">×</button>
          </div>
        </td>
        <td>
          <span class="currency-symbol">R$</span>
          <input class="input-tabela-valor" value="${formatarValor(item.valor)}" readonly>
        </td>
        <td>R$ ${formatarValor(item.subtotal)}</td>
        <td></td>
      `;

    const inputValor = tr.querySelector(".input-tabela-valor");

    // Edit Value Logic
    inputValor.addEventListener("click", () => {
      inputValor.removeAttribute("readonly");
      inputValor.select();
      inputValor.classList.add("editando");
    });

    inputValor.addEventListener("blur", async () => {
      inputValor.setAttribute("readonly", true);
      inputValor.classList.remove("editando");

      const novoValor = Number(inputValor.value.replace(",", "."));

      if (isNaN(novoValor) || novoValor <= 0) {
        alert("Valor inválido");
        inputValor.value = formatarValor(item.valor); // reset
        return;
      }

      // Compara com tolerância para evitar problemas de precisão
      const valorOriginal = parseFloat(item.valor.toFixed(2));
      const valorNovo = parseFloat(novoValor.toFixed(2));

      if (valorNovo !== valorOriginal) {
        await atualizarPrecoItens(item.itensOriginais, novoValor);
      }
    });

    inputValor.addEventListener("keydown", (e) => {
      if (e.key === "Enter") inputValor.blur();
    });

    tr.querySelector(".btn-menos")
      .addEventListener("click", () => removerUmItem(item));

    tr.querySelector(".btn-mais")
      .addEventListener("click", () => adicionarMaisItem(item));

    tr.querySelector(".btn-remover")
      .addEventListener("click", () => removerItensProduto(item.ids));

    tabelaItensBody.appendChild(tr);
  });

  totalComandaDiv.innerHTML = `<strong>TOTAL: R$ ${formatarValor(total)}</strong>`;
  totalComandaGlobal = total;
  atualizarDivisaoTotal();
}

function atualizarDivisaoTotal() {
  const qtd = parseInt(qtdPessoasInput.value, 10);

  if (!qtd || qtd < 1 || totalComandaGlobal <= 0) {
    valorPorPessoaDiv.innerText = "R$ 0,00";
    return;
  }

  const valor = totalComandaGlobal / qtd;

  valorPorPessoaDiv.innerText =
    `R$ ${valor.toFixed(2).replace(".", ",")}`;
}

async function atualizarPrecoItens(listaItens, novoValor) {
  try {
    for (const item of listaItens) {
      const payload = {
        codigo: item.codigo,
        descricao: item.descricao,
        quantidade: item.quantidade,
        valor: novoValor
      };

      const res = await fetch(`${API_URL}/itens/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Falha ao atualizar");
    }
    await carregarItensComanda();
  } catch (err) {
    alert("Erro ao atualizar valores");
    console.error(err);
  }
}

carregarItensComanda();

buscaCodigo.addEventListener("input", filtrarProdutos);
buscaCodigo.addEventListener("focus", () => {
  buscaCodigo.value = "";
  buscaDescricao.value = "";
  valorProduto.value = "";
  qtdProduto.value = "";
  produtoSelecionado = null;
  renderizarProdutos(produtos);
});
buscaDescricao.addEventListener("input", filtrarProdutos);

valorProduto.addEventListener("click", () => {
  valorProduto.removeAttribute("readonly");
  valorProduto.select();
});

valorProduto.addEventListener("blur", () => {
  valorProduto.setAttribute("readonly", true);
});

// Flag para evitar múltiplas chamadas de impressão
let isPrinting = false;

// Event listeners dos botões de ação (já definidos acima)
// Atalhos de teclado
document.addEventListener("keydown", (e) => {
  // F1 - Pagamento
  if (e.key === "F1") {
    e.preventDefault();
    e.stopPropagation();
    btnPagamento.click();
  }
  // F2 - Imprimir
  else if (e.key === "F2") {
    e.preventDefault();
    e.stopPropagation();
    if (!isPrinting) {
      btnImprimir.click();
    }
  }
  // F8 - Fechar
  else if (e.key === "F8") {
    e.preventDefault();
    e.stopPropagation();
    btnSair.click();
  }
  // Escape - Sair
  else if (e.key === "Escape") {
    btnSair.click();
  }
});


btnDividirItem.addEventListener("click", async () => {
  modalDividirItem.classList.remove("hidden");
  await carregarItensDivisao();
});

let itensAgrupadosDivisao = [];

const btnFecharModalItemTop = document.getElementById("btnFecharModalItemTop");
if (btnFecharModalItemTop) {
  btnFecharModalItemTop.addEventListener("click", () => {
    modalDividirItem.classList.add("hidden");
  });
}

btnFecharModalItem.addEventListener("click", () => {
  modalDividirItem.classList.add("hidden");
  // Reset acumulados se fechar sem adicionar ao pagamento? 
  // Na verdade, melhor manter se o usuário apenas fechou e abriu de novo, mas resetar no init.
});

if (btnConsiderarSelecaoItem) btnConsiderarSelecaoItem.addEventListener("click", () => aplicarConsiderar(false));

btnAdicionarAoPagamento.addEventListener("click", () => {
  const totalSelecionadoAgora = parseFloat(btnAdicionarAoPagamento.dataset.totalRaw || 0);

  if (totalSelecionadoAgora <= 0 && (!itensSelecionadosAcumulados || itensSelecionadosAcumulados.length === 0)) {
    alert("Selecione pelo menos um item");
    return;
  }

  const totalFinalParaPagamento = parseFloat(btnAdicionarAoPagamento.dataset.totalAcumulado || 0);
  const itensJson = encodeURIComponent(JSON.stringify(itensSelecionadosAcumulados));

  // Persiste no sessionStorage antes de ir para a página de pagamento
  sessionStorage.setItem(`comanda_${numero}_selecao`, JSON.stringify(itensSelecionadosAcumulados));

  window.location.href = `pagamento.html?numero=${numero}&valor=${totalFinalParaPagamento.toFixed(2)}&itens=${itensJson}`;
});

function aplicarConsiderar(silencioso = false) {
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

  if (!itensSelecionadosAcumulados) itensSelecionadosAcumulados = [];
  breakdown.forEach(b => {
    const existe = itensSelecionadosAcumulados.find(x => x.id === b.id);
    if (existe) existe.quantidade += b.quantidade;
    else itensSelecionadosAcumulados.push(b);
  });

  // Salva no sessionStorage
  sessionStorage.setItem(`comanda_${numero}_selecao`, JSON.stringify(itensSelecionadosAcumulados));

  let totalAcumuladoVal = 0;
  itensAgrupadosDivisao.forEach(i => {
    totalAcumuladoVal += (i.total_considerado || 0) * i.valor;
  });

  btnAdicionarAoPagamento.dataset.totalAcumulado = totalAcumuladoVal;
  totalSelecionadoItemEl.innerText = `R$ ${formatarValor(totalAcumuladoVal)}`;

  renderizarTabelaDivisao(itensAgrupadosDivisao);
}

async function carregarItensDivisao() {
  tbodyDivisaoItens.innerHTML = "";

  const res = await fetch(`${API_URL}/comandas/${numero}/itens`);
  if (!res.ok) return;

  const itens = await res.json();

  // agrupar como você já faz na comanda
  const mapa = {};

  itens.forEach(i => {
    const jaConsid = (itensSelecionadosAcumulados || []).find(x => x.id === i.id)?.quantidade || 0;

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

  itensAgrupadosDivisao = Object.values(mapa); // Salva para uso no clique de adicionar
  renderizarTabelaDivisao(itensAgrupadosDivisao);
}

function renderizarTabelaDivisao(itens) {
  tbodyDivisaoItens.innerHTML = "";
  itens.forEach(item => {
    const jaConsiderado = item.total_considerado || 0;
    const pagoVisual = item.total_paga + jaConsiderado;
    const disponivelParaSelecionar = item.total_quantidade - pagoVisual;

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${item.codigo}</td>
      <td>${item.descricao}</td>
      <td style="text-align: center;">${item.total_quantidade}</td>
      <td style="text-align: center;">${pagoVisual.toFixed(0)}</td>
      <td style="text-align: center;" class="qtd-restante">${disponivelParaSelecionar}</td>
      <td style="text-align: center;">
        <input type="number"
               min="0"
               max="${disponivelParaSelecionar}"
               value="0"
               step="1"
               data-valor="${item.valor}"
               data-total="${disponivelParaSelecionar}"
               class="qtd-pagar"
               style="width: 50px; text-align: center; margin: 0;" ${disponivelParaSelecionar <= 0 ? 'disabled' : ''}>
      </td>
      <td>R$ ${formatarValor(item.valor)}</td>
      <td class="subtotal-item">R$ 0,00</td>
    `;

    const inputQtd = tr.querySelector(".qtd-pagar");
    const restanteEl = tr.querySelector(".qtd-restante");
    const subtotalEl = tr.querySelector(".subtotal-item");

    const atualizarInputLocal = () => {
      let qtd = Math.floor(Number(inputQtd.value) || 0);
      const total = Number(inputQtd.dataset.total);
      const valor = Number(inputQtd.dataset.valor);

      if (qtd < 0) qtd = 0;
      if (qtd > total) qtd = total;
      inputQtd.value = qtd;

      const restante = total - qtd;
      restanteEl.innerText = Math.floor(restante);

      const subtotal = qtd * valor;
      subtotalEl.innerText = `R$ ${formatarValor(subtotal)}`;
      subtotalEl.dataset.valorRaw = subtotal;

      item.selecionado = qtd; // Salva para o breakdown
      atualizarTotalSelecionado();
    };

    inputQtd.addEventListener("input", atualizarInputLocal);

    tbodyDivisaoItens.appendChild(tr);
  });
  atualizarTotalSelecionado();
}

function atualizarTotalSelecionado() {
  let total = 0;
  itensAgrupadosDivisao.forEach(i => {
    total += (i.total_considerado || 0) * i.valor;
  });

  // Soma o que está selecionado agora nos inputs
  const inputs = tbodyDivisaoItens.querySelectorAll(".qtd-pagar");
  inputs.forEach(input => {
    const qtd = Number(input.value) || 0;
    const valor = Number(input.dataset.valor);
    total += qtd * valor;
  });

  totalSelecionadoItemEl.innerText = `R$ ${formatarValor(total)}`;
  // totalRaw guarda apenas o que está selecionado nos inputs agora (para o considerarSelecao)
  let totalInputs = 0;
  inputs.forEach(input => {
    totalInputs += (Number(input.value) || 0) * Number(input.dataset.valor);
  });
  btnAdicionarAoPagamento.dataset.totalRaw = totalInputs;
  // totalAcumulado guarda o total do que será enviado (considerados + inputs atuais)
  btnAdicionarAoPagamento.dataset.totalAcumulado = total;
}

const inputPessoasComanda = document.getElementById("pessoasComanda");

// Sincroniza "Pessoas na comanda" com "Dividir total por"
inputPessoasComanda.addEventListener("input", () => {
  const valor = parseInt(inputPessoasComanda.value, 10);
  if (!isNaN(valor) && valor >= 1) {
    qtdPessoasInput.value = valor;
    atualizarDivisaoTotal();
  }
});

// Permite edição independente no "Dividir total por"
qtdPessoasInput.addEventListener("input", atualizarDivisaoTotal);


