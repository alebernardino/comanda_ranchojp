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
const modalProduto = document.getElementById("modalProduto");
const novoCodigo = document.getElementById("novoCodigo");
const novaDescricao = document.getElementById("novaDescricao");
const valorNovoProduto = document.getElementById("valorNovoProduto");

const btnSalvarProduto = document.getElementById("salvarProduto");
const btnCancelarProduto = document.getElementById("cancelarProduto");
const qtdProduto = document.getElementById("qtdProduto");
const valorProduto = document.getElementById("valorProduto");
const btnAddItem = document.getElementById("btnAddItem");

const tabelaItensBody = document.querySelector("#tabelaItens tbody");
const totalComandaDiv = document.getElementById("totalComanda");


let produtoSelecionado = null;
let produtos = [];

async function carregarProdutos() {
  const res = await fetch(`${API_URL}/produtos`);
  produtos = await res.json();
  renderizarProdutos(produtos);
}

carregarProdutos();

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

  // 🔹 quando código completo (3 dígitos)
  if (codigo.length === 3) {
    const produto = produtos.find(
      p => String(p.codigo) === codigo
    );

    if (produto) {
      selecionarProduto(produto);
      return;
    }

    // código completo, mas inexistente
    mostrarOpcaoAdicionarProduto(codigo);
    return;
  }

  // 🔹 busca parcial (enquanto digita)
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
}

function selecionarProduto(produto) {
  produtoSelecionado = produto;
  
  buscaCodigo.value = produto.codigo;
  buscaDescricao.value = produto.descricao;
  valorProduto.value = produto.valor.toFixed(2);

  qtdProduto.value = "";
  qtdProduto.focus();
  
  listaProdutos.innerHTML = "";
}

qtdProduto.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();

    if (!qtdProduto.value || Number(qtdProduto.value) <= 0) {
      alert("Quantidade inválida");
      return;
    }

    valorProduto.focus();
    valorProduto.select(); // 🔥 seleciona tudo
  }
});

async function adicionarItem() {
  if (!produtoSelecionado) {
    alert("Selecione um produto");
    return;
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

btnAddItem.addEventListener("click", adicionarItem);

valorProduto.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    adicionarItem();
  }
});

function mostrarOpcaoAdicionarProduto(codigo) {
  listaProdutos.innerHTML = "";

  const div = document.createElement("div");
  div.className = "produto-nao-encontrado";

  div.innerHTML = `
    Produto não encontrado
    <button id="btnAddProduto">+</button>
  `;

  listaProdutos.appendChild(div);

  document
    .getElementById("btnAddProduto")
    .addEventListener("click", () => abrirModalProduto(codigo));
}

function abrirModalProduto(codigo) {
  novoCodigo.value = codigo;
  novaDescricao.value = "";
  valorNovoProduto.value = "";
  modalProduto.classList.remove("hidden");
}

function fecharModalProduto() {
  modalProduto.classList.add("hidden");
}

btnSalvarProduto.addEventListener("click", salvarProduto);

async function salvarProduto() {
  const codigo = novoCodigo.value.trim();
  const descricao = novaDescricao.value.trim();

  if (!codigo || !descricao) {
    alert("Preencha todos os campos");
    return;
  }

  const valorStr = valorNovoProduto.value.replace(",", ".");
  const valor = Number(valorStr);

  if (isNaN(valor) || valor <= 0) {
    alert("Valor inválido");
    return;
  }

  const res = await fetch(`${API_URL}/produtos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      codigo,
      descricao,
      valor
    })
  });

  if (!res.ok) {
    alert("Erro ao salvar produto");
    return;
  }

  fecharModalProduto();
  await carregarProdutos();

  // já deixa o produto pronto para lançar na comanda
  buscaCodigo.value = codigo;
  filtrarProdutos();
}


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
  if (item.quantidade <=1) {
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
buscaDescricao.addEventListener("input", filtrarProdutos);
btnCancelarProduto.addEventListener("click", fecharModalProduto);

// ENTER navega entre campos do modal de produto
novoCodigo.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    novaDescricao.focus();
  }
});

novaDescricao.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    valorNovoProduto.focus();
    valorNovoProduto.select();
  }
});

valorNovoProduto.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    btnSalvarProduto.click();
  }
});




