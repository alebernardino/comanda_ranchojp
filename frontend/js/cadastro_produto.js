const params = new URLSearchParams(window.location.search);
const codigoParam = params.get("codigo");

const novoCodigo = document.getElementById("novoCodigo");
const novaDescricao = document.getElementById("novaDescricao");
const valorNovoProduto = document.getElementById("valorNovoProduto");
const btnSalvar = document.getElementById("salvarProduto");
const btnVoltar = document.getElementById("voltar");

const tabelaBody = document.querySelector("#tabelaProdutos tbody");
console.log('tabelaBody element:', tabelaBody);
if (!tabelaBody) {
  console.error('Tabela tbody not found – cannot render products');
}


// Init
if (codigoParam) {
  novoCodigo.value = codigoParam;
  novaDescricao.focus();
}

console.log("Iniciando carregamento de produtos...");
carregarProdutosCadastrados().catch(err => {
  console.error("Erro fatal ao carregar produtos:", err);
  alert("Erro ao carregar tabela: " + err.message);
});

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

  const res = await fetch(`${API_URL}/produtos/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ codigo, descricao, valor })
  });

  if (!res.ok) {
    const err = await res.json();
    alert(err.detail || "Erro ao salvar produto");
    return;
  }

  alert("Produto salvo com sucesso!");

  // Limpa campos
  novoCodigo.value = "";
  novaDescricao.value = "";
  valorNovoProduto.value = "";
  novoCodigo.focus();

  // Recarrega lista
  await carregarProdutosCadastrados();
}

function voltar() {
  const numero = params.get("numero");
  if (numero) {
    window.location.href = `comanda.html?numero=${numero}`;
  } else {
    window.history.back();
  }
}

async function carregarProdutosCadastrados() {
  console.log("Fetching produtos...");
  const res = await fetch(`${API_URL}/produtos`);
  if (!res.ok) {
    console.error(`Failed to fetch produtos: HTTP ${res.status}`);
    alert(`Erro ao carregar produtos (HTTP ${res.status})`);
    return;
  }
  const produtos = await res.json();
  console.log(`Received ${produtos.length} produtos`);

  // Sort by code numeric
  produtos.sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true }));

  tabelaBody.innerHTML = "";

  try {
    produtos.forEach(p => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><input class="input-tabela-texto" value="${p.codigo}" data-field="codigo" readonly></td>
        <td><input class="input-tabela-texto" value="${p.descricao}" data-field="descricao" readonly></td>
        <td><input class="input-tabela-valor" value="${p.valor.toFixed(2)}" data-field="valor" readonly></td>
        <td style="text-align:center;"><input type="checkbox" ${p.ativo ? "checked" : ""} data-field="ativo" style="cursor:pointer;"></td>
      `;
      // Listeners for text/valor inputs
      const textInputs = tr.querySelectorAll('input:not([type="checkbox"]):not([data-field="codigo"])');
      textInputs.forEach(input => {
        input.addEventListener("click", () => {
          input.removeAttribute("readonly");
          input.classList.add("editando");
          input.select();
        });
        input.addEventListener("keydown", e => { if (e.key === "Enter") input.blur(); });
        input.addEventListener("blur", async () => {
          input.setAttribute("readonly", true);
          input.classList.remove("editando");
          const field = input.dataset.field;
          let valor = input.value.trim();
          let mudou = false;
          if (field === 'valor') {
            const num = Number(valor.replace(",", "."));
            if (Math.abs(num - p.valor) > 0.001) mudou = true;
          } else {
            if (valor !== String(p[field])) mudou = true;
          }
          if (!mudou) return;
          if (!confirm(`Confirmar alteração de ${field.toUpperCase()}?`)) {
            if (field === 'valor') input.value = p.valor.toFixed(2);
            else input.value = p[field];
            return;
          }
          await atualizarProduto(p, field, valor);
        });
      });
      // Checkbox listener
      const check = tr.querySelector("input[type='checkbox']");
      check.addEventListener("change", async () => {
        const novoStatus = check.checked;
        if (!confirm(`Deseja alterar status para ${novoStatus ? "ATIVO" : "INATIVO"}?`)) {
          check.checked = !novoStatus;
          return;
        }
        await atualizarProduto(p, "ativo", novoStatus);
      });
      tabelaBody.appendChild(tr);
    });
  } catch (err) {
    console.error('Erro ao renderizar tabela de produtos:', err);
    alert('Erro ao exibir produtos. Veja o console para detalhes.');
  }
}

async function atualizarProduto(produtoOriginal, campo, novoValor) {
  // Cria objeto atualizado
  const produtoAtualizado = {
    codigo: produtoOriginal.codigo,
    descricao: produtoOriginal.descricao,
    valor: produtoOriginal.valor,
    ativo: produtoOriginal.ativo
  };

  if (campo === "ativo") {
    produtoAtualizado.ativo = novoValor;
  } else if (campo === "valor") {
    const v = Number(novoValor.replace(",", "."));
    if (isNaN(v) || v <= 0) {
      alert("Valor inválido");
      carregarProdutosCadastrados();
      return;
    }
    produtoAtualizado.valor = v;
  } else {
    if (!novoValor) {
      alert("Campo não pode ser vazio");
      carregarProdutosCadastrados();
      return;
    }
    produtoAtualizado[campo] = novoValor;
  }

  try {
    const res = await fetch(`${API_URL}/produtos/${produtoOriginal.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(produtoAtualizado)
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.detail || "Erro ao atualizar");
      carregarProdutosCadastrados();
      return;
    }

    // Sucesso
    await carregarProdutosCadastrados();

  } catch (error) {
    console.error(error);
    alert("Erro de conexão");
  }
}
