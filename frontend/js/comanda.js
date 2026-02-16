// Variáveis de elementos DOM da Comanda
let modalComanda, btnFecharModalComanda, tituloComanda, nomeComanda, telefoneComanda, pessoasComanda;
let qtdPessoasInput, buscaCodigo, buscaDescricao, qtdProduto, valorProduto;
let tabelaItensBody, totalComandaDiv, valorPorPessoaDiv;
let btnImprimirModal, btnPagamentoModal, btnDividirItemModal, btnAbrirModalCadastroComanda;
let sectionComandas;

function carregarElementosComanda() {
    modalComanda = document.getElementById("modalComanda");
    btnFecharModalComanda = document.getElementById("btnFecharModalComanda");
    tituloComanda = document.getElementById("tituloComanda");
    nomeComanda = document.getElementById("nomeComanda");
    telefoneComanda = document.getElementById("telefoneComanda");
    pessoasComanda = document.getElementById("pessoasComanda");
    qtdPessoasInput = document.getElementById("qtdPessoas");
    buscaCodigo = document.getElementById("buscaCodigo");
    buscaDescricao = document.getElementById("buscaDescricao");
    qtdProduto = document.getElementById("qtdProduto");
    valorProduto = document.getElementById("valorProduto");
    tabelaItensBody = document.querySelector("#tabelaItens tbody");
    totalComandaDiv = document.getElementById("totalComanda");
    valorPorPessoaDiv = document.getElementById("valorPorPessoa");
    btnImprimirModal = document.getElementById("btnImprimirModal");
    btnPagamentoModal = document.getElementById("btnPagamentoModal");
    btnDividirItemModal = document.getElementById("btnDividirItemModal");
    btnAbrirModalCadastroComanda = document.getElementById("btnAbrirModalCadastroComanda");
    sectionComandas = document.getElementById("sectionComandas");
}

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
        // Tenta buscar ou criar a comanda em uma única chamada
        await garantirComanda(numero);

        if (modalComanda) modalComanda.classList.remove("hidden");
        await carregarDadosComanda();
        await carregarItensComanda();

        setTimeout(() => {
            const temItens = tabelaItensBody && tabelaItensBody.children.length > 0;
            if (!temItens) {
                if (telefoneComanda) {
                    telefoneComanda.focus();
                    telefoneComanda.select();
                }
            } else {
                if (buscaCodigo) {
                    buscaCodigo.focus();
                    buscaCodigo.select();
                }
            }
        }, 150);
    } catch (err) {
        console.error(err);
        alert("Erro ao acessar/criar comanda");
    }
}

async function carregarDadosComanda() {
    const comanda = await getComanda(currentComandaNumero);
    if (tituloComanda) tituloComanda.innerText = `Comanda ${comanda.numero}`;
    if (nomeComanda) nomeComanda.value = comanda.nome || "";
    if (telefoneComanda) telefoneComanda.value = comanda.telefone || "";
    if (telefoneComanda && !nomeComanda.value.trim()) {
        await preencherNomePorTelefone();
    }
    if (pessoasComanda) pessoasComanda.value = comanda.quantidade_pessoas || 1;
    if (qtdPessoasInput) qtdPessoasInput.textContent = comanda.quantidade_pessoas || 1;
    renderizarProdutosModal(produtosCache);
}

async function carregarItensComanda() {
    const itens = await getItensComanda(currentComandaNumero);
    renderizarTabelaItens(itens);
}

function parseValorComandaInput(valor) {
    let txt = String(valor ?? "").trim();
    if (!txt) return NaN;
    txt = txt.replace(/\s/g, "");
    const hasComma = txt.includes(",");
    const hasDot = txt.includes(".");
    if (hasComma && hasDot) {
        if (txt.lastIndexOf(",") > txt.lastIndexOf(".")) {
            txt = txt.replace(/\./g, "").replace(",", ".");
        } else {
            txt = txt.replace(/,/g, "");
        }
    } else if (hasComma) {
        txt = txt.replace(",", ".");
    }
    return parseFloat(txt);
}

function renderizarTabelaItens(itens) {
    if (!tabelaItensBody) return;
    tabelaItensBody.innerHTML = "";
    let total = 0;
    const mapa = {};
    itens.forEach(i => { if (!mapa[i.id]) mapa[i.id] = i; });

    const itensLista = Object.values(mapa).sort((a, b) => String(a.codigo).localeCompare(String(b.codigo), undefined, { numeric: true }));
    const formatarQuantidade = (valor) => {
        const numero = Number(valor);
        if (Number.isNaN(numero)) return "0";
        return numero.toLocaleString("pt-BR", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
    };
    const selecaoAtual = JSON.parse(sessionStorage.getItem(`comanda_${currentComandaNumero}_selecao`) || "null") || [];
    const selecionadosPorItem = selecaoAtual.reduce((acc, item) => {
        const qtd = Number(item.quantidade) || 0;
        if (qtd <= 0) return acc;
        acc[item.id] = (acc[item.id] || 0) + qtd;
        return acc;
    }, {});

    itensLista.forEach(item => {
        total += item.subtotal;
        const qtdTotal = Number(item.quantidade) || 0;
        const qtdPaga = Number(item.quantidade_paga) || 0;
        const qtdConsiderada = Number(selecionadosPorItem[item.id]) || 0;
        const qtdPagaVisual = Math.min(qtdPaga + qtdConsiderada, qtdTotal);
        const qtdRestante = Math.max(qtdTotal - qtdPagaVisual, 0);
        const tr = document.createElement("tr");
        const valorFormatado = Number(item.valor || 0).toFixed(2).replace(".", ",");
        tr.innerHTML = `
      <td>${item.codigo}</td>
      <td>${item.descricao}</td>
      <td>
        <div class="qtd-container">
          <button class="btn-qtd" onclick="removerUmItemIndex(${JSON.stringify(item).replace(/"/g, '&quot;')})">-</button>
          <button class="btn-qtd" onclick="adicionarMaisItemIndex(${JSON.stringify(item).replace(/"/g, '&quot;')})">+</button>
          <span class="qtd-item">${formatarQuantidade(qtdTotal)}</span>
          <button class="btn-remover-mini" onclick="removerItemUnico(${item.id})">×</button>
        </div>
      </td>
      <td style="text-align: right;">${formatarQuantidade(qtdPagaVisual)}</td>
      <td style="text-align: right;">${formatarQuantidade(qtdRestante)}</td>
      <td style="text-align: right; white-space: nowrap;">
        <div style="display:inline-flex; align-items:center; gap:4px; border:1px solid #cbd5e1; border-radius:6px; padding:2px 6px; background:#fff;">
          <span style="font-weight:700; color:#64748b;">R$</span>
          <input
            type="text"
            value="${valorFormatado}"
            data-valor-original="${Number(item.valor || 0)}"
            onblur="salvarValorItemComandaInline(${item.id}, this)"
            onkeydown="if(event.key==='Enter'){event.preventDefault(); this.blur();}"
            style="width:72px; border:none; outline:none; text-align:right; font-weight:700; color:#0f172a; background:transparent;"
          />
        </div>
      </td>
      <td style="text-align: right; white-space: nowrap;">R$ ${formatarMoeda(item.subtotal)}</td>
    `;
        tabelaItensBody.appendChild(tr);
    });
    if (totalComandaDiv) totalComandaDiv.innerHTML = `<strong>TOTAL: R$ ${formatarMoeda(total)}</strong>`;
    totalComandaGlobal = total;
    atualizarDivisaoTotal();
}

async function removerItemUnico(id) {
    if (!confirm("Remover este item?")) return;
    await deleteItem(id);
    await carregarItensComanda();
}

async function salvarValorItemComandaInline(itemId, inputEl) {
    if (!inputEl) return;
    const novoValor = parseValorComandaInput(inputEl.value);
    const original = Number(inputEl.dataset.valorOriginal || 0);

    if (Number.isNaN(novoValor) || novoValor <= 0) {
        alert("Valor inválido");
        inputEl.value = original.toFixed(2).replace(".", ",");
        return;
    }

    if (Math.abs(novoValor - original) < 0.0001) {
        inputEl.value = original.toFixed(2).replace(".", ",");
        return;
    }

    const item = (await getItensComanda(currentComandaNumero)).find(i => i.id === itemId);
    if (!item) return;

    await updateItem(item.id, {
        codigo: String(item.codigo),
        descricao: String(item.descricao),
        quantidade: Number(item.quantidade) || 0,
        valor: novoValor
    });

    await carregarItensComanda();
}

async function adicionarMaisItemIndex(item) {
    await addItemComanda(currentComandaNumero, {
        codigo: String(item.codigo),
        descricao: String(item.descricao),
        quantidade: 1,
        valor: item.valor
    });
    await carregarItensComanda();
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
    await updateItem(item.id, {
        codigo: String(item.codigo),
        descricao: String(item.descricao),
        quantidade: novaQtd,
        valor: item.valor
    });
    await carregarItensComanda();
}

async function atualizarComandaAPI() {
    if (!currentComandaNumero) return;
    await updateComanda(currentComandaNumero, {
        numero: currentComandaNumero,
        nome: (nomeComanda ? nomeComanda.value.trim() : null) || null,
        telefone: (telefoneComanda ? telefoneComanda.value.trim() : null) || null
    });
}

async function preencherNomePorTelefone() {
    const telefone = telefoneComanda ? telefoneComanda.value.trim() : "";
    if (!telefone) return;
    try {
        const cliente = await getClientePorTelefone(telefone);
        if (nomeComanda && !nomeComanda.value.trim()) {
            nomeComanda.value = cliente.nome || "";
        }
    } catch (err) {
        if (err.message && err.message !== "Cliente não encontrado") {
            console.error(err);
        }
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

    try {
        await addItemComanda(currentComandaNumero, {
            codigo: String(produtoSelecionado.codigo),
            descricao: String(produtoSelecionado.descricao),
            quantidade: qtd,
            valor: val
        });

        if (buscaCodigo) { buscaCodigo.value = ""; buscaCodigo.focus(); }
        if (buscaDescricao) buscaDescricao.value = "";
        if (qtdProduto) qtdProduto.value = "";
        if (valorProduto) valorProduto.value = "";
        produtoSelecionado = null;
        await carregarItensComanda();
        renderizarProdutosModal(produtosCache);

        // Atualizar card no dashboard em tempo real
        if (typeof atualizarCardComanda === "function") {
            atualizarCardComanda(currentComandaNumero, true);
        }
    } catch (error) {
        alert(error.message || "Erro ao adicionar item");
    }
}

function atualizarDivisaoTotal() {
    if (!valorPorPessoaDiv) return;
    const qtd = parseInt(qtdPessoasInput ? qtdPessoasInput.textContent : 1) || 1;
    valorPorPessoaDiv.innerText = `R$ ${formatarMoeda(totalComandaGlobal / qtd)}`;
}

function setupComandaListeners() {
    carregarElementosComanda();

    if (btnFecharModalComanda) {
        btnFecharModalComanda.onclick = () => {
            modalComanda.classList.add("hidden");
            if (typeof carregarDashboard === "function") carregarDashboard();
            if (typeof focarCampoQuickComanda === "function") focarCampoQuickComanda();
        };
    }

    if (btnAbrirModalCadastroComanda) {
        btnAbrirModalCadastroComanda.onclick = () => {
            const codBusca = buscaCodigo ? buscaCodigo.value.trim() : "";
            if (typeof abrirModalCadastroProdutos === "function") abrirModalCadastroProdutos();
            const novoCodigoInput = document.getElementById("novoCodigo");
            const novaDescricaoInput = document.getElementById("novaDescricao");
            if (codBusca && novoCodigoInput) {
                novoCodigoInput.value = codBusca;
                if (novaDescricaoInput) novaDescricaoInput.focus();
            }
        };
    }

    if (nomeComanda) {
        nomeComanda.onblur = () => atualizarComandaAPI();
        nomeComanda.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); if (pessoasComanda) pessoasComanda.focus(); } };
    }
    if (telefoneComanda) {
        telefoneComanda.onblur = async () => { await preencherNomePorTelefone(); await atualizarComandaAPI(); };
        telefoneComanda.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); if (nomeComanda) nomeComanda.focus(); } };
    }
    if (pessoasComanda) {
        pessoasComanda.oninput = () => { if (qtdPessoasInput) qtdPessoasInput.textContent = pessoasComanda.value; atualizarDivisaoTotal(); };
        pessoasComanda.onblur = () => atualizarComandaAPI();
        pessoasComanda.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); if (buscaCodigo) { buscaCodigo.focus(); buscaCodigo.select(); } } };
    }
    if (buscaCodigo) {
        buscaCodigo.oninput = () => { if (typeof filtrarProdutosModal === "function") filtrarProdutosModal(buscaCodigo.value.trim()); };
        buscaCodigo.onkeydown = e => { if (e.key === "Enter") adicionarItemComanda(); };
    }
    if (buscaDescricao) {
        buscaDescricao.oninput = () => { if (typeof filtrarProdutosModal === "function") filtrarProdutosModal(buscaDescricao.value.trim()); };
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
                    if (buscaCodigo && !cod) buscaCodigo.focus();
                    else if (buscaDescricao && !desc) buscaDescricao.focus();
                    else if (qtdProduto && !qtd) qtdProduto.focus();
                    else if (valorProduto && !val) valorProduto.focus();
                    return;
                }

                if (e.key === "Enter") {
                    adicionarItemComanda();
                } else if (e.key === "Tab") {
                    e.preventDefault();
                    if (confirm("Adicionar item?")) {
                        adicionarItemComanda();
                    } else {
                        if (buscaCodigo) { buscaCodigo.focus(); buscaCodigo.select(); }
                    }
                }
            }
        };
    }

    if (btnDividirItemModal) btnDividirItemModal.onclick = () => { if (typeof abrirModalDividirItem === "function") abrirModalDividirItem(); };
    if (btnImprimirModal) btnImprimirModal.onclick = () => { if (typeof imprimirComandaAcao === "function") imprimirComandaAcao(); };
    if (btnPagamentoModal) btnPagamentoModal.onclick = () => { if (typeof abrirModalPagamento === "function") abrirModalPagamento(); };
}

// ===============================
// EXPOSIÇÃO GLOBAL DAS FUNÇÕES
// ===============================
window.setupComandaListeners = setupComandaListeners;
window.abrirComanda = abrirComanda;
window.carregarDadosComanda = carregarDadosComanda;
window.carregarItensComanda = carregarItensComanda;
window.renderizarTabelaItens = renderizarTabelaItens;
window.removerItemUnico = removerItemUnico;
window.salvarValorItemComandaInline = salvarValorItemComandaInline;
window.adicionarMaisItemIndex = adicionarMaisItemIndex;
window.removerUmItemIndex = removerUmItemIndex;
window.atualizarComandaAPI = atualizarComandaAPI;
window.adicionarItemComanda = adicionarItemComanda;
window.atualizarDivisaoTotal = atualizarDivisaoTotal;
