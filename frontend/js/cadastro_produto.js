const params = new URLSearchParams(window.location.search);
const codigoParam = params.get("codigo");

const novoCodigo = document.getElementById("novoCodigo");
const novaDescricao = document.getElementById("novaDescricao");
const valorNovoProduto = document.getElementById("valorNovoProduto");
const btnSalvar = document.getElementById("salvarProduto");
const btnVoltar = document.getElementById("voltar");

if (codigoParam) {
  novoCodigo.value = codigoParam;
  novaDescricao.focus();
}

btnSalvar.addEventListener("click", salvarProduto);
btnVoltar.addEventListener("click", voltar);

async function salvarProduto() {
  const codigo = novoCodigo.value.trim();
  const descricao = novaDescricao.value.trim();
  const valor = Number(valorNovoProduto.value.replace(",", "."));

  if (!codigo || !descricao || isNaN(valor) || valor <= 0) {
    alert("Preencha corretamente todos os campos");
    return;
  }

  const res = await fetch("http://127.0.0.1:8000/produtos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ codigo, descricao, valor })
  });

  if (!res.ok) {
    alert("Erro ao salvar produto");
    return;
  }

  window.location.href = `comanda.html?numero=${params.get("numero")}&codigo=${codigo}`;
}

function voltar() {
  window.history.back();
}
