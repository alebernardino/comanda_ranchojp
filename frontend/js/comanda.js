// ===============================
// FUNÇÕES PÚBLICAS
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
    if (qtdPessoasInput) qtdPessoasInput.textContent = comanda.quantidade_pessoas || 1;
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
    const qtd = parseInt(qtdPessoasInput ? qtdPessoasInput.textContent : 1) || 1;
    valorPorPessoaDiv.innerText = `R$ ${formatarMoeda(totalComandaGlobal / qtd)}`;
}

// ===============================
// EXPOSIÇÃO GLOBAL DAS FUNÇÕES
// ===============================
window.abrirComanda = abrirComanda;
window.carregarDadosComanda = carregarDadosComanda;
window.carregarItensComanda = carregarItensComanda;
window.renderizarTabelaItens = renderizarTabelaItens;
window.removerItemUnico = removerItemUnico;
window.adicionarMaisItemIndex = adicionarMaisItemIndex;
window.removerUmItemIndex = removerUmItemIndex;
window.atualizarComandaAPI = atualizarComandaAPI;
window.adicionarItemComanda = adicionarItemComanda;
window.atualizarDivisaoTotal = atualizarDivisaoTotal;
