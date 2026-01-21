// Variaveis de elementos DOM do Estoque
let sectionEstoque, navEstoque, tabelaEstoqueBody;
let filtroEstoqueBusca, estoqueProdutoSelect, estoqueQtdInput, estoqueMinimoInput, estoqueMotivoInput;
let btnEntradaEstoque, btnSaidaEstoque, btnAjusteEstoque, btnAtualizarMinimo;
let estoqueCache = [];

function carregarElementosEstoque() {
    sectionEstoque = document.getElementById("sectionEstoque");
    navEstoque = document.getElementById("navEstoque");
    tabelaEstoqueBody = document.getElementById("tabelaEstoqueBody");
    filtroEstoqueBusca = document.getElementById("estoqueBusca");
    estoqueProdutoSelect = document.getElementById("estoqueProduto");
    estoqueQtdInput = document.getElementById("estoqueQuantidade");
    estoqueMinimoInput = document.getElementById("estoqueMinimo");
    estoqueMotivoInput = document.getElementById("estoqueMotivo");
    btnEntradaEstoque = document.getElementById("btnEntradaEstoque");
    btnSaidaEstoque = document.getElementById("btnSaidaEstoque");
    btnAjusteEstoque = document.getElementById("btnAjusteEstoque");
    btnAtualizarMinimo = document.getElementById("btnAtualizarMinimo");
}

function formatarDataHora(valor) {
    if (!valor) return "-";
    const data = new Date(valor.replace(" ", "T"));
    if (Number.isNaN(data.getTime())) return valor;
    return data.toLocaleString("pt-BR");
}

async function carregarEstoque() {
    try {
        estoqueCache = await getEstoque();
        renderizarTabelaEstoque(estoqueCache);
        preencherSelectProdutosEstoque();
    } catch (err) {
        console.error(err);
        alert(err.message || "Erro ao carregar estoque");
    }
}

function preencherSelectProdutosEstoque() {
    if (!estoqueProdutoSelect) return;
    estoqueProdutoSelect.innerHTML = `<option value="">Selecione...</option>`;
    estoqueCache.forEach(item => {
        const opt = document.createElement("option");
        opt.value = item.produto_id;
        opt.textContent = `${item.codigo} - ${item.descricao}`;
        estoqueProdutoSelect.appendChild(opt);
    });
}

function renderizarTabelaEstoque(lista) {
    if (!tabelaEstoqueBody) return;
    tabelaEstoqueBody.innerHTML = "";
    lista.forEach(item => {
        const abaixoMinimo = Number(item.quantidade) < Number(item.minimo);
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td style="padding: 12px; text-align: center;">${item.codigo || "-"}</td>
            <td style="padding: 12px; text-align: left;">${item.descricao || "-"}</td>
            <td style="padding: 12px; text-align: right; color: ${abaixoMinimo ? "#ef4444" : "#0f172a"}; font-weight: ${abaixoMinimo ? "700" : "500"};">
                ${Number(item.quantidade || 0).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </td>
            <td style="padding: 12px; text-align: right;">${Number(item.minimo || 0).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
            <td style="padding: 12px; text-align: center;">${formatarDataHora(item.atualizado_em)}</td>
        `;
        tabelaEstoqueBody.appendChild(tr);
    });
}

function filtrarEstoque() {
    if (!filtroEstoqueBusca) return renderizarTabelaEstoque(estoqueCache);
    const termo = filtroEstoqueBusca.value.trim().toLowerCase();
    if (!termo) return renderizarTabelaEstoque(estoqueCache);
    const filtrados = estoqueCache.filter(item =>
        String(item.codigo || "").toLowerCase().includes(termo) ||
        String(item.descricao || "").toLowerCase().includes(termo)
    );
    renderizarTabelaEstoque(filtrados);
}

async function aplicarMovimentoEstoque(tipo) {
    const produtoId = parseInt(estoqueProdutoSelect ? estoqueProdutoSelect.value : "", 10);
    const quantidade = parseFloat(estoqueQtdInput ? estoqueQtdInput.value : 0);
    const motivo = estoqueMotivoInput ? estoqueMotivoInput.value.trim() : null;
    if (!produtoId) return alert("Selecione um produto");
    if (!quantidade || quantidade <= 0) return alert("Quantidade inválida");

    const payload = {
        produto_id: produtoId,
        tipo,
        quantidade,
        motivo,
        origem: tipo === "entrada" ? "compra" : (tipo === "saida" ? "avulso" : "ajuste")
    };

    try {
        if (tipo === "entrada") await estoqueEntrada(payload);
        if (tipo === "saida") await estoqueSaida(payload);
        if (tipo === "ajuste") await estoqueAjuste(payload);

        if (estoqueQtdInput) estoqueQtdInput.value = "";
        if (estoqueMotivoInput) estoqueMotivoInput.value = "";
        await carregarEstoque();
    } catch (err) {
        console.error(err);
        alert(err.message || "Erro ao atualizar estoque");
    }
}

async function atualizarMinimo() {
    const produtoId = parseInt(estoqueProdutoSelect ? estoqueProdutoSelect.value : "", 10);
    const minimo = parseFloat(estoqueMinimoInput ? estoqueMinimoInput.value : 0);
    if (!produtoId) return alert("Selecione um produto");
    if (Number.isNaN(minimo)) return alert("Mínimo inválido");

    try {
        await atualizarMinimoEstoque(produtoId, minimo);
        if (estoqueMinimoInput) estoqueMinimoInput.value = "";
        await carregarEstoque();
    } catch (err) {
        console.error(err);
        alert(err.message || "Erro ao atualizar mínimo");
    }
}

function alternarParaEstoque() {
    document.getElementById("sectionComandas").classList.add("hidden");
    document.getElementById("sectionProdutos").classList.add("hidden");
    if (document.getElementById("sectionClientes")) document.getElementById("sectionClientes").classList.add("hidden");
    if (document.getElementById("sectionConfiguracao")) document.getElementById("sectionConfiguracao").classList.add("hidden");
    if (document.getElementById("sectionUsuarios")) document.getElementById("sectionUsuarios").classList.add("hidden");
    if (document.getElementById("sectionColaboradores")) document.getElementById("sectionColaboradores").classList.add("hidden");
    if (document.getElementById("sectionFinanceiro")) document.getElementById("sectionFinanceiro").classList.add("hidden");
    if (document.getElementById("sectionRelatorios")) document.getElementById("sectionRelatorios").classList.add("hidden");
    if (document.getElementById("sectionFluxoCaixa")) document.getElementById("sectionFluxoCaixa").classList.add("hidden");
    if (document.getElementById("sectionFechamento")) document.getElementById("sectionFechamento").classList.add("hidden");
    if (sectionEstoque) sectionEstoque.classList.remove("hidden");

    document.getElementById("navDashboard").classList.remove("active");
    document.getElementById("navProdutosSessao").classList.remove("active");
    if (document.getElementById("navClientes")) document.getElementById("navClientes").classList.remove("active");
    if (document.getElementById("navConfiguracao")) document.getElementById("navConfiguracao").classList.remove("active");
    if (document.getElementById("navUsuarios")) document.getElementById("navUsuarios").classList.remove("active");
    if (document.getElementById("navColaboradores")) document.getElementById("navColaboradores").classList.remove("active");
    if (document.getElementById("navFinanceiro")) document.getElementById("navFinanceiro").classList.remove("active");
    if (document.getElementById("navRelatorios")) document.getElementById("navRelatorios").classList.remove("active");
    if (document.getElementById("navFechamento")) document.getElementById("navFechamento").classList.remove("active");
    if (navEstoque) navEstoque.classList.add("active");

    carregarEstoque();
}

function setupEstoqueListeners() {
    carregarElementosEstoque();

    if (navEstoque) navEstoque.onclick = (e) => { e.preventDefault(); alternarParaEstoque(); };
    if (filtroEstoqueBusca) filtroEstoqueBusca.oninput = filtrarEstoque;
    if (btnEntradaEstoque) btnEntradaEstoque.onclick = () => aplicarMovimentoEstoque("entrada");
    if (btnSaidaEstoque) btnSaidaEstoque.onclick = () => aplicarMovimentoEstoque("saida");
    if (btnAjusteEstoque) btnAjusteEstoque.onclick = () => aplicarMovimentoEstoque("ajuste");
    if (btnAtualizarMinimo) btnAtualizarMinimo.onclick = atualizarMinimo;
}

document.addEventListener("DOMContentLoaded", setupEstoqueListeners);

window.setupEstoqueListeners = setupEstoqueListeners;
window.alternarParaEstoque = alternarParaEstoque;
