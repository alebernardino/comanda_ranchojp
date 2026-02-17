// financeiro.js

// VariÃ¡veis de elementos DOM do Financeiro
let sectionFinanceiro, navFinanceiro, tabelaFinanceiroBody, btnSalvarFin, finDataInput;

function carregarElementosFinanceiro() {
    sectionFinanceiro = document.getElementById("sectionFinanceiro");
    navFinanceiro = document.getElementById("navFinanceiro");
    tabelaFinanceiroBody = document.getElementById("tabelaFinanceiroBody");
    btnSalvarFin = document.getElementById("btnSalvarFin");
    finDataInput = document.getElementById("finData");
}

let financeiroCache = [];
let sortFinCol = 'data';
let sortFinAsc = false;
let financeiroEmEdicaoId = null;

async function carregarFinanceiro() {
    try {
        financeiroCache = await getFinanceiro();
        filtrarERenderizarFinanceiro();
    } catch (err) {
        console.error("Erro ao carregar registros financeiros:", err);
    }
}

function filtrarERenderizarFinanceiro() {
    if (!tabelaFinanceiroBody) return;

    const fNome = document.getElementById("filtroFinNome") ? document.getElementById("filtroFinNome").value.toLowerCase() : "";
    const fServico = document.getElementById("filtroFinServico") ? document.getElementById("filtroFinServico").value.toLowerCase() : "";

    let lista = financeiroCache.filter(p => {
        const matchNome = (p.nome || "").toLowerCase().includes(fNome);
        const matchServico = (p.item_servico || "").toLowerCase().includes(fServico);
        return matchNome && matchServico;
    });

    // OrdenaÃ§Ã£o
    lista.sort((a, b) => {
        let valA = a[sortFinCol];
        let valB = b[sortFinCol];

        if (sortFinCol === 'valor') {
            return sortFinAsc ? valA - valB : valB - valA;
        }

        if (sortFinCol === 'data') {
            const dateA = new Date(valA || 0);
            const dateB = new Date(valB || 0);
            return sortFinAsc ? dateA - dateB : dateB - dateA;
        }

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortFinAsc ? -1 : 1;
        if (valA > valB) return sortFinAsc ? 1 : -1;
        return 0;
    });

    renderizarTabelaFinanceiro(lista);
}

function renderizarTabelaFinanceiro(lista) {
    if (!tabelaFinanceiroBody) return;
    tabelaFinanceiroBody.innerHTML = "";

    lista.forEach(p => {
        const tr = document.createElement("tr");
        tr.style.borderBottom = "1px solid #f1f5f9";

        const dataExibicao = p.data ? new Date(p.data).toLocaleDateString('pt-BR') : '-';
        const dataInput = p.data ? new Date(p.data).toISOString().slice(0, 10) : '';
        const esc = (v) => String(v || "").replace(/&/g, "&amp;").replace(/\"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

        const tagStatus = p.pago
            ? `<span style="background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 999px; font-size: 0.7rem; font-weight: 800; border: 1px solid #bbf7d0; cursor: pointer; display: inline-block; width: 60px; text-align: center;">SIM</span>`
            : `<span style="background: #fee2e2; color: #991b1b; padding: 4px 12px; border-radius: 999px; font-size: 0.7rem; font-weight: 800; border: 1px solid #fecaca; cursor: pointer; display: inline-block; width: 60px; text-align: center;">NÃO</span>`;

        tr.innerHTML = `
            <td style="padding: 10px 15px; color: #64748b;">
                <input type="date" class="input-tabela-texto" value="${dataInput}"
                    onfocus="iniciarEdicaoFinanceiroCampo(this)"
                    onkeydown="teclaEdicaoFinanceiroCampo(event, ${p.id}, 'data', this)"
                    onblur="confirmarEdicaoFinanceiroCampo(${p.id}, 'data', this)"
                    title="${dataExibicao}"
                    style="width: 100%; border: none; background: transparent;">
            </td>
            <td style="padding: 10px 15px; font-weight: 600; color: #1e293b;">
                <input class="input-tabela-texto" value="${esc(p.nome)}"
                    onfocus="iniciarEdicaoFinanceiroCampo(this)"
                    onkeydown="teclaEdicaoFinanceiroCampo(event, ${p.id}, 'nome', this)"
                    onblur="confirmarEdicaoFinanceiroCampo(${p.id}, 'nome', this)"
                    style="width: 100%; border: none; background: transparent; font-weight: 600;">
            </td>
            <td style="padding: 10px 15px; color: #64748b;">
                <input class="input-tabela-texto" value="${esc(p.item_servico)}"
                    onfocus="iniciarEdicaoFinanceiroCampo(this)"
                    onkeydown="teclaEdicaoFinanceiroCampo(event, ${p.id}, 'item_servico', this)"
                    onblur="confirmarEdicaoFinanceiroCampo(${p.id}, 'item_servico', this)"
                    style="width: 100%; border: none; background: transparent;">
            </td>
            <td style="padding: 10px 15px; color: #64748b;">
                <input class="input-tabela-texto" value="${esc(p.forma_pagamento || '')}"
                    onfocus="iniciarEdicaoFinanceiroCampo(this)"
                    onkeydown="teclaEdicaoFinanceiroCampo(event, ${p.id}, 'forma_pagamento', this)"
                    onblur="confirmarEdicaoFinanceiroCampo(${p.id}, 'forma_pagamento', this)"
                    placeholder="-"
                    style="width: 100%; border: none; background: transparent;">
            </td>
            <td style="padding: 10px 15px; text-align: right; font-weight: 700; color: #ef4444;">
                <input class="input-tabela-valor" value="${Number(p.valor || 0).toFixed(2)}"
                    onfocus="iniciarEdicaoFinanceiroCampo(this)"
                    onkeydown="teclaEdicaoFinanceiroCampo(event, ${p.id}, 'valor', this)"
                    onblur="confirmarEdicaoFinanceiroCampo(${p.id}, 'valor', this)"
                    style="width: 110px; border: none; background: transparent; text-align: right; font-weight: 700; color: #ef4444;">
            </td>
            <td style="padding: 15px; text-align: center;">
                <div onclick="toggleStatusPagamento(${p.id}, ${p.pago})" title="Clique para alterar status">
                    ${tagStatus}
                </div>
            </td>
            <td style="padding: 15px; text-align: center;">
                <button onclick="excluirRegistroFin(${p.id})" style="background:#fee2e2; border:none; color:#ef4444; width:28px; height:28px; border-radius:50%; font-size:1.2rem; font-weight:bold; cursor:pointer;" title="Excluir">×</button>
            </td>
        `;
        tabelaFinanceiroBody.appendChild(tr);
    });
}

function iniciarEdicaoFinanceiroCampo(el) {
    el.dataset.originalValue = el.value;
    el.dataset.cancelEdit = "0";
}

function teclaEdicaoFinanceiroCampo(event, id, campo, el) {
    if (event.key === "Enter") {
        event.preventDefault();
        el.blur();
        return;
    }
    if (event.key === "Escape") {
        event.preventDefault();
        el.dataset.cancelEdit = "1";
        el.value = el.dataset.originalValue || "";
        el.blur();
    }
}

function parseValorFinanceiroInline(valor) {
    const txt = String(valor || "").trim().replace(/\s/g, "").replace(",", ".");
    const num = Number(txt);
    return Number.isFinite(num) ? num : NaN;
}

async function confirmarEdicaoFinanceiroCampo(id, campo, el) {
    const cancelou = el.dataset.cancelEdit === "1";
    const original = el.dataset.originalValue || "";
    if (cancelou) {
        el.dataset.cancelEdit = "0";
        el.value = original;
        return;
    }

    const atual = (el.value || "").trim();
    if (atual === original.trim()) return;

    const registro = financeiroCache.find(r => r.id === id);
    if (!registro) return;

    const payload = {};
    if (campo === "data") {
        payload.data = atual ? new Date(`${atual}T12:00:00`).toISOString() : null;
    } else if (campo === "nome") {
        if (!atual) {
            alert("Nome é obrigatório.");
            el.value = original;
            return;
        }
        payload.nome = atual;
    } else if (campo === "item_servico") {
        if (!atual) {
            alert("Serviço/Produto é obrigatório.");
            el.value = original;
            return;
        }
        payload.item_servico = atual;
    } else if (campo === "forma_pagamento") {
        payload.forma_pagamento = atual;
    } else if (campo === "valor") {
        const valor = parseValorFinanceiroInline(atual);
        if (!Number.isFinite(valor) || valor < 0) {
            alert("Valor inválido.");
            el.value = original;
            return;
        }
        payload.valor = valor;
    } else {
        return;
    }

    try {
        await updateFinanceiro(id, payload);
        await carregarFinanceiro();
    } catch (err) {
        console.error(err);
        alert(err.message || "Erro ao atualizar lançamento");
        el.value = original;
    }
}

async function toggleStatusPagamento(id, statusAtual) {
    try {
        await updateFinanceiro(id, { pago: !statusAtual });
        await carregarFinanceiro();
    } catch (err) {
        console.error(err);
        alert(err.message || "Erro ao alterar status de pagamento");
    }
}

function ordenarFinanceiro(coluna) {
    if (sortFinCol === coluna) {
        sortFinAsc = !sortFinAsc;
    } else {
        sortFinCol = coluna;
        sortFinAsc = coluna !== 'data' && coluna !== 'valor';
    }
    filtrarERenderizarFinanceiro();
}

function limparFiltrosFinanceiro() {
    if (document.getElementById("filtroFinNome")) document.getElementById("filtroFinNome").value = "";
    if (document.getElementById("filtroFinServico")) document.getElementById("filtroFinServico").value = "";
    filtrarERenderizarFinanceiro();
}

async function salvarLancamentoFin() {
    const dataInputVal = document.getElementById("finData").value;
    const nome = document.getElementById("finNome").value.trim();
    const servico = document.getElementById("finServico").value.trim();
    const valor = parseFloat(document.getElementById("finValor").value);
    const forma = document.getElementById("finForma").value.trim();
    const pago = document.getElementById("finPago").checked;

    if (!nome || !servico || isNaN(valor)) {
        return alert("Por favor, preencha o Nome, ServiÃ§o e Valor.");
    }

    let payload_data = null;
    if (dataInputVal) {
        payload_data = new Date(dataInputVal + "T12:00:00").toISOString();
    }

    const payload = {
        data: payload_data,
        nome: nome,
        item_servico: servico,
        valor: valor,
        forma_pagamento: forma,
        pago: pago
    };

    try {
        if (financeiroEmEdicaoId) {
            await updateFinanceiro(financeiroEmEdicaoId, payload);
        } else {
            await createFinanceiro(payload);
        }

        limparFormFinanceiro();
        await carregarFinanceiro();
        // Recolhe o form
        const content = document.getElementById('formFinanceiroContent');
        if (content) content.style.display = 'none';
        const icon = document.getElementById('iconToggleFin');
        if (icon) icon.innerText = 'âž•';
    } catch (err) {
        console.error("Erro ao salvar:", err);
        alert(err.message || "Erro de conexÃ£o ao salvar");
    }
}

function limparFormFinanceiro() {
    financeiroEmEdicaoId = null;
    configurarDataPadrao();
    if (document.getElementById("finNome")) document.getElementById("finNome").value = "";
    if (document.getElementById("finServico")) document.getElementById("finServico").value = "";
    if (document.getElementById("finValor")) document.getElementById("finValor").value = "";
    if (document.getElementById("finForma")) document.getElementById("finForma").value = "";
    if (document.getElementById("finPago")) document.getElementById("finPago").checked = true;
    if (btnSalvarFin) btnSalvarFin.innerText = "Salvar Pagamento";
}

function configurarDataPadrao() {
    if (finDataInput) {
        // Usar data local para evitar problema de fuso horÃ¡rio
        const agora = new Date();
        const hoje = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`;
        finDataInput.value = hoje;
    }
}

async function excluirRegistroFin(id) {
    if (!confirm("Tem certeza que deseja remover este registro?")) return;
    try {
        await deleteFinanceiro(id);
        await carregarFinanceiro();
    } catch (err) {
        console.error(err);
        alert(err.message || "Erro ao excluir registro");
    }
}

function editarRegistroFin(id) {
    const registro = financeiroCache.find(r => r.id === id);
    if (!registro) return;

    financeiroEmEdicaoId = id;
    if (document.getElementById("finData")) {
        const data = registro.data ? new Date(registro.data) : null;
        if (data) {
            const yyyy = data.getFullYear();
            const mm = String(data.getMonth() + 1).padStart(2, '0');
            const dd = String(data.getDate()).padStart(2, '0');
            document.getElementById("finData").value = `${yyyy}-${mm}-${dd}`;
        }
    }
    if (document.getElementById("finNome")) document.getElementById("finNome").value = registro.nome || "";
    if (document.getElementById("finServico")) document.getElementById("finServico").value = registro.item_servico || "";
    if (document.getElementById("finValor")) document.getElementById("finValor").value = Number(registro.valor || 0).toFixed(2);
    if (document.getElementById("finForma")) document.getElementById("finForma").value = registro.forma_pagamento || "";
    if (document.getElementById("finPago")) document.getElementById("finPago").checked = !!registro.pago;

    const content = document.getElementById('formFinanceiroContent');
    if (content) content.style.display = 'block';
    const icon = document.getElementById('iconToggleFin');
    if (icon) icon.innerText = 'âž–';
    if (btnSalvarFin) btnSalvarFin.innerText = "Atualizar Pagamento";
}

function setupFinanceiroEnterNavigation() {
    const fields = [
        "finData",
        "finNome",
        "finServico",
        "finValor",
        "finForma"
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
                        const btn = document.getElementById("btnSalvarFin");
                        if (btn) btn.focus();
                    }
                }
            };
        }
    });

    const btnSalvar = document.getElementById("btnSalvarFin");
    if (btnSalvar) {
        btnSalvar.onkeydown = (e) => {
            if (e.key === "Tab") {
                e.preventDefault();
                if (confirm("Deseja salvar este lanÃ§amento financeiro?")) {
                    salvarLancamentoFin();
                }
            }
        };
    }
}

function alternarParaFinanceiro() {
    document.getElementById("sectionComandas").classList.add("hidden");
    document.getElementById("sectionProdutos").classList.add("hidden");
    document.getElementById("sectionColaboradores").classList.add("hidden");
    if (document.getElementById("sectionClientes")) document.getElementById("sectionClientes").classList.add("hidden");
    if (document.getElementById("sectionEstoque")) document.getElementById("sectionEstoque").classList.add("hidden");
    if (document.getElementById("sectionConfiguracao")) document.getElementById("sectionConfiguracao").classList.add("hidden");
    if (document.getElementById("sectionUsuarios")) document.getElementById("sectionUsuarios").classList.add("hidden");
    if (document.getElementById("sectionRelatorios")) document.getElementById("sectionRelatorios").classList.add("hidden");
    if (document.getElementById("sectionFechamento")) document.getElementById("sectionFechamento").classList.add("hidden");
    sectionFinanceiro.classList.remove("hidden");

    document.getElementById("navDashboard").classList.remove("active");
    document.getElementById("navProdutosSessao").classList.remove("active");
    document.getElementById("navColaboradores").classList.remove("active");
    if (document.getElementById("navClientes")) document.getElementById("navClientes").classList.remove("active");
    if (document.getElementById("navEstoque")) document.getElementById("navEstoque").classList.remove("active");
    if (document.getElementById("navConfiguracao")) document.getElementById("navConfiguracao").classList.remove("active");
    if (document.getElementById("navUsuarios")) document.getElementById("navUsuarios").classList.remove("active");
    if (document.getElementById("navRelatorios")) document.getElementById("navRelatorios").classList.remove("active");
    if (document.getElementById("navFechamento")) document.getElementById("navFechamento").classList.remove("active");
    navFinanceiro.classList.add("active");

    configurarDataPadrao();
    carregarFinanceiro();

    // Focar no campo de nome (ou data se preferir, mas nome Ã© mais comum)
    setTimeout(() => {
        const inputNome = document.getElementById("finNome");
        if (inputNome) inputNome.focus();
    }, 100);
}

// Listeners
function setupFinanceiroListeners() {
    carregarElementosFinanceiro();
    setupFinanceiroEnterNavigation();

    if (navFinanceiro) navFinanceiro.onclick = (e) => { e.preventDefault(); alternarParaFinanceiro(); };
    if (btnSalvarFin) btnSalvarFin.onclick = salvarLancamentoFin;
}

// Chamar no carregamento inicial
document.addEventListener("DOMContentLoaded", setupFinanceiroListeners);

// Global
window.excluirRegistroFin = excluirRegistroFin;
window.ordenarFinanceiro = ordenarFinanceiro;
window.filtrarERenderizarFinanceiro = filtrarERenderizarFinanceiro;
window.limparFiltrosFinanceiro = limparFiltrosFinanceiro;
window.toggleStatusPagamento = toggleStatusPagamento;
window.editarRegistroFin = editarRegistroFin;
window.iniciarEdicaoFinanceiroCampo = iniciarEdicaoFinanceiroCampo;
window.teclaEdicaoFinanceiroCampo = teclaEdicaoFinanceiroCampo;
window.confirmarEdicaoFinanceiroCampo = confirmarEdicaoFinanceiroCampo;

