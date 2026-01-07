const prodPageValor = document.getElementById("prodPageValor");
const tabelaProdutosPageBody = document.getElementById("tabelaProdutosPageBody");
const listaProdutos = document.getElementById("listaProdutos");
const tabelaProdutosModalBody = document.querySelector("#tabelaProdutosModal tbody");

// Elementos do Modal de Cadastro
const modalCadastroProduto = document.getElementById("modalCadastroProduto");
const btnFecharModalCadastro = document.getElementById("btnFecharModalCadastro");
const btnSalvarProdutoModal = document.getElementById("btnSalvarProdutoModal");
const btnSalvarProdutoPage = document.getElementById("btnSalvarProdutoPage");
const novoCodigoInput = document.getElementById("novoCodigo");
const novaDescricaoInput = document.getElementById("novaDescricao");
const valorNovoProdutoInput = document.getElementById("valorNovoProduto");
const prodPageCodigo = document.getElementById("prodPageCodigo");
const prodPageDescricao = document.getElementById("prodPageDescricao");

// Seções e Navegação
const sectionProdutos = document.getElementById("sectionProdutos");
const navProdutosSessao = document.getElementById("navProdutosSessao");

// ===============================
// FUNÇÕES PÚBLICAS - CARREGAMENTO
// ===============================

async function carregarProdutosBase() {
    const res = await fetch(`${API_URL}/produtos/`);
    produtosCache = await res.json();
    produtosCache.sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true }));
}

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

// ===============================
// FUNÇÕES PÚBLICAS - RENDERIZAÇÃO
// ===============================

function renderizarProdutosModal(lista) {
    if (!listaProdutos) return;
    listaProdutos.innerHTML = "";
    lista.forEach(p => {
        const div = document.createElement("div");
        div.className = "produto-item";
        if (!p.ativo) div.classList.add("produto-inactive");
        div.innerHTML = `<span class="produto-cod">${p.codigo}</span><span class="produto-desc">${p.descricao}</span><span class="produto-valor">R$ ${formatarMoeda(p.valor)}</span>`;
        div.onclick = () => selecionarProduto(p);
        listaProdutos.appendChild(div);
    });
}

function renderizarTabelaProdutosPage(produtos) {
    if (!tabelaProdutosPageBody) return;
    tabelaProdutosPageBody.innerHTML = "";
    produtos.forEach(p => {
        const grupo = p.codigo.charAt(0);
        const tr = document.createElement("tr");
        tr.classList.add("table-row");
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

// ===============================
// FUNÇÕES PÚBLICAS - SELEÇÃO E FILTRO
// ===============================

function selecionarProduto(p) {
    produtoSelecionado = p;
    const buscaCodigo = document.getElementById("buscaCodigo");
    const buscaDescricao = document.getElementById("buscaDescricao");
    const valorProduto = document.getElementById("valorProduto");
    const qtdProduto = document.getElementById("qtdProduto");

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
    const buscaCodigo = document.getElementById("buscaCodigo");
    const buscaDescricao = document.getElementById("buscaDescricao");
    const valorProduto = document.getElementById("valorProduto");

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

// ===============================
// FUNÇÕES PÚBLICAS - MODAIS
// ===============================

function abrirModalCadastroProdutos() {
    if (modalCadastroProduto) {
        modalCadastroProduto.classList.remove("hidden");
        // Limpar campos
        if (novoCodigoInput) novoCodigoInput.value = "";
        if (novaDescricaoInput) novaDescricaoInput.value = "";
        if (valorNovoProdutoInput) valorNovoProdutoInput.value = "";
        // Focar no código
        if (novoCodigoInput) novoCodigoInput.focus();
    }
}

// ===============================
// FUNÇÕES PÚBLICAS - CRUD
// ===============================

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

async function editProduto(id, campo, novoValor) {
    const body = {};
    if (campo === "ativo") body[campo] = novoValor;
    else if (campo === "valor") body[campo] = parseFloat(novoValor);
    else body[campo] = String(novoValor);

    await fetch(`${API_URL}/produtos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    await carregarProdutosCadastrados();
    await carregarProdutosBase();
}

async function excluirProduto(id) {
    if (!confirm("Deseja excluir este produto?")) return;
    const res = await fetch(`${API_URL}/produtos/${id}`, { method: "DELETE" });
    if (res.ok) {
        await carregarProdutosCadastrados();
        await carregarProdutosBase();
    } else {
        const err = await res.json();
        alert(err.detail || "Erro ao excluir");
    }
}

// ===============================
// FUNÇÕES PÚBLICAS - NAVEGAÇÃO
// ===============================

function setupProdutosEnterNavigation() {
    const fields = [
        "prodPageCodigo",
        "prodPageDescricao",
        "prodPageValor"
    ];

    fields.forEach((id, index) => {
        const el = document.getElementById(id);
        if (el) {
            el.onkeydown = (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    const nextId = fields[index + 1];
                    if (nextId) {
                        document.getElementById(nextId).focus();
                    } else {
                        const btn = document.getElementById("btnSalvarProdutoPage");
                        if (btn) btn.focus();
                    }
                }
            };
        }
    });

    const btnSalvar = document.getElementById("btnSalvarProdutoPage");
    if (btnSalvar) {
        btnSalvar.onkeydown = (e) => {
            if (e.key === "Tab") {
                e.preventDefault();
                if (confirm("Deseja salvar o novo produto?")) {
                    salvarNovoProdutoSessao();
                }
            }
        };
    }

    // Listeners movem-se para cá
    if (btnFecharModalCadastro) btnFecharModalCadastro.onclick = () => { modalCadastroProduto.classList.add("hidden"); carregarProdutosBase(); };
    if (navProdutosSessao) navProdutosSessao.onclick = (e) => { e.preventDefault(); alternarParaProdutos(); };
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
}

function alternarParaProdutos() {
    const navDashboard = document.getElementById("navDashboard");

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
    navProdutosSessao.classList.add("active");

    carregarProdutosCadastrados();

    // Focar no primeiro campo
    setTimeout(() => {
        const inputCod = document.getElementById("prodPageCodigo");
        if (inputCod) inputCod.focus();
    }, 100);
}

// ===============================
// EXPOSIÇÃO GLOBAL DAS FUNÇÕES
// ===============================
window.carregarProdutosBase = carregarProdutosBase;
window.carregarProdutosCadastrados = carregarProdutosCadastrados;
window.renderizarProdutosModal = renderizarProdutosModal;
window.renderizarTabelaProdutosPage = renderizarTabelaProdutosPage;
window.selecionarProduto = selecionarProduto;
window.filtrarProdutosModal = filtrarProdutosModal;
window.filtrarERenderizarProdutosPage = filtrarERenderizarProdutosPage;
window.limparFiltrosSessao = limparFiltrosSessao;
window.atualizarIconesOrdenacao = atualizarIconesOrdenacao;
window.ordenarProdutos = ordenarProdutos;
window.abrirModalCadastroProdutos = abrirModalCadastroProdutos;
window.salvarNovoProduto = salvarNovoProduto;
window.salvarNovoProdutoSessao = salvarNovoProdutoSessao;
window.editProduto = editProduto;
window.excluirProduto = excluirProduto;
window.alternarParaProdutos = alternarParaProdutos;

// Chamar no carregamento inicial
document.addEventListener("DOMContentLoaded", () => {
    setupProdutosEnterNavigation();
});
