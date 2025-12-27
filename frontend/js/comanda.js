// pega numero da comanda da URL
const params = new URLSearchParams(window.location.search);
const numero = params.get("numero");

if (!numero) {
  alert("Comanda não informada");
  window.location.href = "index.html";
}

const titulo = document.getElementById("tituloComanda");

async function carregarComanda() {
  const res = await fetch(`${API_URL}/comandas/${numero}`);

  if (!res.ok) {
    alert("Comanda não encontrada");
    window.location.href = "index.html";
    return;
  }

  const comanda = await res.json();
  titulo.innerText = `Comanda ${comanda.numero}`;
}

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

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    btnSair.click();
  }

  if (e.key === "F3") {
    e.preventDefault(); // Evita busca do navegador
    btnPagamento.click();
  }

  if (e.key === "F2") {
    btnImprimir.click();
  }
});



async function carregarProdutos() {
  const res = await fetch(`${API_URL}/produtos`);
  produtos = await res.json();
  produtos.sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true }));
  renderizarProdutos(produtos);
}



function renderizarProdutos(lista) {
  listaProdutos.innerHTML = "";

  lista.forEach(p => {
    const div = document.createElement("div");
    div.className = "produto-item";
    div.innerText = `${p.codigo} - ${p.descricao} (R$ ${p.valor.toFixed(2)})`;
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
      valorProduto.value = exactMatch.valor.toFixed(2);
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
  valorProduto.value = produto.valor.toFixed(2);

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
  if (item.quantidade <= 1) {
    alert("Use o botão 🗑️ para remover o item.");
    return;
  }
  // pega um ID daquele produto
  const idParaRemover = item.ids[0];

  if (!idParaRemover) return;

  const res = await fetch(`${API_URL}/itens/${idParaRemover}`, {
    method: "DELETE"
  });

  if (!res.ok) {
    alert("Erro ao remover item");
    return;
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
        ids: [i.id]   // 🔥 AQUI
      };
      ordem.push(i.codigo);
      ordem.sort((a, b) => a.localeCompare(b));
    } else {
      mapa[i.codigo].quantidade += i.quantidade;
      mapa[i.codigo].subtotal += i.subtotal;
      mapa[i.codigo].ids.push(i.id); // 🔥 AQUI
    }
  });

  let total = 0;

  ordem.forEach(codigo => {
    const item = mapa[codigo];
    total += item.subtotal;

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${item.codigo}</td>
      <td>
      <button class="btn-qtd" data-action="menos">−</button>
      <span class="qtd-item">${item.quantidade}</span>
      <button class="btn-qtd" data-action="mais">+</button>
      </td>
      <td>${item.descricao}</td>
      <td>R$ ${item.valor.toFixed(2)}</td>
      <td>R$ ${item.subtotal.toFixed(2)}</td>
      <td><button class="btn-remover">🗑️</button></td>
    `;

    const btnMais = tr.querySelector('[data-action="mais"]');
    const btnMenos = tr.querySelector('[data-action="menos"]')

    btnMais.addEventListener("click", () => {
      adicionarMaisItem(item);
    });

    btnMenos.addEventListener("click", () => {
      removerUmItem(item);
    });

    tr.querySelector(".btn-remover")
      .addEventListener("click", () => removerItensProduto(item.ids));

    tabelaItensBody.appendChild(tr);
  });

  totalComandaDiv.innerHTML = `<strong>TOTAL: R$ ${total.toFixed(2)}</strong>`;
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

