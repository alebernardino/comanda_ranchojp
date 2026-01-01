const params = new URLSearchParams(window.location.search);
const numero = params.get("numero");

if (!numero) {
    alert("Comanda não informada");
    window.location.href = "index.html";
}

// Elementos
const tituloPagamento = document.getElementById("tituloPagamento");
const totalItensEl = document.getElementById("totalItens");
const totalPagoEl = document.getElementById("totalPago");
const saldoDevedorEl = document.getElementById("saldoDevedor");
const statusComandaEl = document.getElementById("statusComanda");
const tabelaPagamentosBody = document.querySelector("#tabelaPagamentos tbody");
const valorPagamentoInput = document.getElementById("valorPagamento");
const btnLancarPagamento = document.getElementById("btnLancarPagamento");
const btnFinalizarComanda = document.getElementById("btnFinalizarComanda");
const btnVoltar = document.getElementById("btnVoltar");
const metodosButtons = document.querySelectorAll(".metodo-btn");

let totalPagoGlobal = 0;
let formaSelecionada = "Cartão Crédito";
let saldoDevedorGlobal = 0;
let totalItensGlobal = 0;

// Elementos Modal Dividir por Item
const btnDividirItem = document.getElementById("btnDividirItem");
const modalDividirItem = document.getElementById("modalDividirItem");
const btnFecharModalItem = document.getElementById("btnFecharModalItem");
const btnFecharModalItemSecundario = document.getElementById("btnFecharModalItemSecundario");
const tbodyDivisaoItens = document.getElementById("tbodyDivisaoItens");
const totalPagoItemEl = document.getElementById("totalPagoItem");
const btnAdicionarValorItem = document.getElementById("btnAdicionarValorItem");
const btnConsiderarSelecao = document.getElementById("btnConsiderarSelecao");

const valorParam = params.get("valor");
const itensParam = params.get("itens");
let itensSelecionadosParaPagamento = null;

if (itensParam) {
    try {
        itensSelecionadosParaPagamento = JSON.parse(decodeURIComponent(itensParam));
    } catch (e) {
        console.error("Erro ao decodificar itens do URL", e);
    }
}

let itensAgrupadosDivisao = [];

// Inicialização
function init() {
    tituloPagamento.innerText = `Pagamento Comanda ${numero}`;
    carregarResumo();
    carregarPagamentos();

    // 👉 Inicializa o estado visual baseado na formaSelecionada inicial
    metodosButtons.forEach(btn => {
        if (btn.dataset.forma === formaSelecionada) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    if (valorParam) {
        valorPagamentoInput.value = parseFloat(valorParam).toFixed(2);
    }

    // 👉 Foco inicial no primeiro botão de método (Crédito)
    if (metodosButtons.length > 0) {
        metodosButtons[0].focus();
    }
}

init();

async function carregarResumo() {
    try {
        const res = await fetch(`${API_URL}/comandas/${numero}/resumo`);
        if (!res.ok) throw new Error("Erro ao carregar resumo");
        const data = await res.json();

        totalItensGlobal = data.total_itens;
        totalPagoGlobal = data.total_pago;

        totalItensEl.innerText = `R$ ${formatarMoeda(totalItensGlobal)}`;
        totalPagoEl.innerText = `R$ ${formatarMoeda(totalPagoGlobal)}`;

        const saldo = totalItensGlobal - totalPagoGlobal;
        saldoDevedorGlobal = saldo > 0 ? saldo : 0;

        saldoDevedorEl.innerText = `R$ ${formatarMoeda(saldoDevedorGlobal)}`;


        // Atualiza valor padrão do input se houver saldo e não veio valor no param
        if (!valorParam && saldoDevedorGlobal > 0 && (valorPagamentoInput.value === "" || valorPagamentoInput.value === "0.00")) {
            valorPagamentoInput.value = saldoDevedorGlobal.toFixed(2);
        }

        // Status
        statusComandaEl.innerText = data.status;
        statusComandaEl.className = `status-comanda status-${data.status}`;

        // Habilita/Desabilita botão de finalizar
        btnFinalizarComanda.disabled = !data.pode_fechar || data.status === 'finalizada';

    } catch (err) {
        console.error(err);
    }
}

async function carregarPagamentos() {
    try {
        const res = await fetch(`${API_URL}/comandas/${numero}/pagamentos`);
        if (!res.ok) throw new Error("Erro ao carregar pagamentos");
        const pagamentos = await res.json();

        renderizarPagamentos(pagamentos);
    } catch (err) {
        console.error(err);
    }
}

function renderizarPagamentos(pagamentos) {
    tabelaPagamentosBody.innerHTML = "";
    pagamentos.forEach(p => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${p.forma}</td>
            <td>R$ ${formatarMoeda(p.valor)}</td>
            <td>
                <button class="btn-remover" data-id="${p.id}">×</button>
            </td>
        `;

        tr.querySelector(".btn-remover").addEventListener("click", () => removerPagamento(p.id));
        tabelaPagamentosBody.appendChild(tr);
    });
}

// Eventos de Seleção de Método
metodosButtons.forEach(btn => {
    // Clique do Mouse
    btn.addEventListener("click", () => {
        selecionarMetodo(btn);
        // Foca e seleciona o valor para facilitar a edição rápida
        valorPagamentoInput.focus();
        valorPagamentoInput.select();
    });

    // Navegação via TAB
    btn.addEventListener("focus", () => {
        selecionarMetodo(btn);
    });
});

function selecionarMetodo(btn) {
    metodosButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    formaSelecionada = btn.dataset.forma;
}

async function lancarPagamento() {
    const valor = parseFloat(valorPagamentoInput.value);
    if (isNaN(valor) || valor <= 0) {
        alert("Informe um valor válido");
        return;
    }

    try {
        const res = await fetch(`${API_URL}/comandas/${numero}/pagamentos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                forma: formaSelecionada,
                valor: valor,
                itens: itensSelecionadosParaPagamento
            })
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.detail || "Erro ao lançar pagamento");
        }

        alert("Pagamento lançado!");
        valorPagamentoInput.value = "";

        // Limpa breakdown após lançamento bem sucedido
        itensSelecionadosParaPagamento = null;
        if (itensAgrupadosDivisao) {
            itensAgrupadosDivisao.forEach(i => {
                i.total_considerado = 0;
                i.itens_originais.forEach(orig => orig.quantidade_considerada = 0);
            });
        }
        totalPagoItemEl.innerText = "R$ 0,00";
        btnAdicionarValorItem.dataset.totalRaw = "0";

        await carregarResumo();
        await carregarPagamentos();
        valorPagamentoInput.focus();

    } catch (err) {
        alert(err.message);
    }
}

async function removerPagamento(id) {
    console.log("Tentando remover pagamento ID:", id);
    // if (!confirm("Remover este pagamento?")) return;

    try {
        const res = await fetch(`${API_URL}/pagamentos/${id}`, {
            method: "DELETE"
        });

        if (!res.ok) throw new Error("Erro ao remover pagamento");

        await carregarResumo();
        await carregarPagamentos();
    } catch (err) {
        alert(err.message);
    }
}

async function finalizarComanda() {

    // 👉 pagamento a maior
    if (saldoDevedorGlobal === 0 && totalPagoGlobal > totalItensGlobal) {

        const diferenca = totalPagoGlobal - totalItensGlobal;

        const confirmar = confirm(
            `ATENÇÃO!\n\n` +
            `A comanda foi paga com valor MAIOR que o total.\n\n` +
            `Valor pago a mais: R$ ${formatarMoeda(diferenca)}\n\n` +
            `Deseja finalizar mesmo assim?`
        );

        if (!confirmar) return;

    } else {
        if (!confirm("Deseja finalizar e fechar esta comanda?")) return;
    }

    try {
        const res = await fetch(`${API_URL}/comandas/${numero}/fechar`, {
            method: "POST"
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.detail || "Erro ao finalizar comanda");
        }

        window.location.href = "index.html";

    } catch (err) {
        alert(err.message);
    }
}


// Listeners
btnLancarPagamento.addEventListener("click", lancarPagamento);
btnFinalizarComanda.addEventListener("click", finalizarComanda);
btnVoltar.addEventListener("click", () => window.location.href = `comanda.html?numero=${numero}`);

valorPagamentoInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") lancarPagamento();
});

// Atalhos de Teclado
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        if (!modalDividirItem.classList.contains("hidden")) {
            fecharModalItem();
        } else {
            btnVoltar.click();
        }
    }
    if (e.key === "F1" && !btnFinalizarComanda.disabled) finalizarComanda();
});

// --- Lógica Modal Dividir por Item ---

btnDividirItem.addEventListener("click", abrirModalItem);
btnFecharModalItem.addEventListener("click", fecharModalItem);
btnFecharModalItemSecundario.addEventListener("click", fecharModalItem);

const btnFecharModalItemTop = document.getElementById("btnFecharModalItemTop");
if (btnFecharModalItemTop) {
    btnFecharModalItemTop.addEventListener("click", fecharModalItem);
}

btnAdicionarValorItem.addEventListener("click", aplicarValorItem);
if (btnConsiderarSelecao) btnConsiderarSelecao.addEventListener("click", considerarSelecao);

function abrirModalItem() {
    modalDividirItem.classList.remove("hidden");
    carregarItensDivisao();
}

function fecharModalItem() {
    modalDividirItem.classList.add("hidden");
}

async function carregarItensDivisao() {
    try {
        const res = await fetch(`${API_URL}/comandas/${numero}/itens`);
        if (!res.ok) throw new Error("Erro ao carregar itens");
        const itens = await res.json();

        const mapa = {};
        itens.forEach(i => {
            if (!mapa[i.codigo]) {
                mapa[i.codigo] = {
                    codigo: i.codigo,
                    descricao: i.descricao,
                    valor: i.valor,
                    total_quantidade: i.quantidade,
                    total_paga: i.quantidade_paga || 0,
                    itens_originais: [{ id: i.id, quantidade: i.quantidade, quantidade_paga: i.quantidade_paga || 0 }]
                };
            } else {
                mapa[i.codigo].total_quantidade += i.quantidade;
                mapa[i.codigo].total_paga += i.quantidade_paga || 0;
                mapa[i.codigo].itens_originais.push({ id: i.id, quantidade: i.quantidade, quantidade_paga: i.quantidade_paga || 0 });
            }
        });

        itensAgrupadosDivisao = Object.values(mapa);
        renderizarItensDivisao(itensAgrupadosDivisao);
    } catch (err) {
        console.error(err);
    }
}

function renderizarItensDivisao(itens) {
    tbodyDivisaoItens.innerHTML = "";
    itens.forEach(item => {
        const jaConsiderado = item.total_considerado || 0;
        const disponivel = item.total_quantidade - item.total_paga - jaConsiderado;
        if (disponivel <= 0) return; // Não mostra itens já totalmente pagos ou considerados

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${item.codigo}</td>
            <td>${item.descricao}</td>
            <td style="text-align: center;">${item.total_quantidade}</td>
            <td style="text-align: center;">${item.total_paga.toFixed(0)}</td>
            <td style="text-align: center;" class="qtd-restante">${Math.floor(disponivel)}</td>
            <td style="text-align: center;">
                <input type="number" min="0" max="${disponivel}" value="0" step="1"
                       class="qtd-pagar" data-valor="${item.valor}" data-disponivel="${disponivel}"
                       style="width: 50px; text-align: center; margin: 0;">
            </td>
            <td>R$ ${formatarMoeda(item.valor)}</td>
            <td class="subtotal-item">R$ ${formatarMoeda(0)}</td>
        `;

        const inputQtd = tr.querySelector(".qtd-pagar");
        const restanteEl = tr.querySelector(".qtd-restante");
        const subtotalEl = tr.querySelector(".subtotal-item");

        const atualizarInputLocal = () => {
            let qtd = Math.floor(parseFloat(inputQtd.value) || 0);
            const disp = parseFloat(inputQtd.dataset.disponivel);
            const valor = parseFloat(inputQtd.dataset.valor);

            if (qtd < 0) qtd = 0;
            if (qtd > disp) qtd = disp;
            inputQtd.value = qtd;

            const restante = disp - qtd;
            restanteEl.innerText = Math.floor(restante);

            const subtotal = qtd * valor;
            subtotalEl.innerText = `R$ ${formatarMoeda(subtotal)}`;
            subtotalEl.dataset.valorRaw = subtotal;

            item.selecionado = qtd; // Salva o que foi digitado
            atualizarTotalSelecionado();
        };

        inputQtd.addEventListener("input", atualizarInputLocal);

        tbodyDivisaoItens.appendChild(tr);
    });
    atualizarTotalSelecionado();
}

function atualizarTotalSelecionado() {
    let total = 0;
    const subtotais = tbodyDivisaoItens.querySelectorAll(".subtotal-item");
    subtotais.forEach(el => {
        total += parseFloat(el.dataset.valorRaw || 0);
    });
    totalPagoItemEl.innerText = `R$ ${formatarMoeda(total)}`;
    btnAdicionarValorItem.dataset.totalRaw = total;
}

async function aplicarValorItem() {
    const totalConsideradoAgora = parseFloat(btnAdicionarValorItem.dataset.totalRaw || 0);

    // Se não tem nada selecionado agora, mas tem algo já considerado antes, apenas fecha
    if (totalConsideradoAgora <= 0 && (!itensSelecionadosParaPagamento || itensSelecionadosParaPagamento.length === 0)) {
        alert("Selecione pelo menos um item para pagar");
        return;
    }

    if (totalConsideradoAgora > 0) {
        // Se tem algo selecionado agora, "considera" antes de fechar
        await considerarSelecao(true);
    }

    // Fecha o modal
    fecharModalItem();

    // Foca no campo de valor
    valorPagamentoInput.focus();
    valorPagamentoInput.select();
}

async function considerarSelecao(pulandoFocus = false) {
    const total = parseFloat(btnAdicionarValorItem.dataset.totalRaw || 0);
    if (total <= 0) {
        if (!pulandoFocus) alert("Selecione pelo menos um item");
        return;
    }

    // Calcula o breakdown para enviar ao backend
    const breakdown = [];

    itensAgrupadosDivisao.forEach(item => {
        let selecionado = item.selecionado || 0;
        if (selecionado > 0) {
            // Distribui entre os itens originais (IDs reais no banco)
            item.itens_originais.forEach(orig => {
                if (selecionado <= 0) return;

                const disponivelNoItem = orig.quantidade - (orig.quantidade_paga || 0) - (orig.quantidade_considerada || 0);
                if (disponivelNoItem > 0) {
                    const pagarAgora = Math.min(selecionado, disponivelNoItem);
                    if (pagarAgora > 0) {
                        breakdown.push({ id: orig.id, quantidade: pagarAgora });
                        orig.quantidade_considerada = (orig.quantidade_considerada || 0) + pagarAgora;
                        selecionado -= pagarAgora;
                    }
                }
            });
            item.total_considerado = (item.total_considerado || 0) + (item.selecionado || 0);
            item.selecionado = 0;
        }
    });

    // Acumula no breakdown global
    if (!itensSelecionadosParaPagamento) itensSelecionadosParaPagamento = [];
    breakdown.forEach(b => {
        const existente = itensSelecionadosParaPagamento.find(x => x.id === b.id);
        if (existente) existente.quantidade += b.quantidade;
        else itensSelecionadosParaPagamento.push(b);
    });

    // Define o valor no input (acumulando se já houver algo ou se vier do breakdown)
    // Se itensSelecionadosParaPagamento estava vazio, o valor era o original. 
    // Para simplificar, vamos recalcular o total do itensSelecionadosParaPagamento
    let valorTotalBreakdown = 0;
    itensAgrupadosDivisao.forEach(item => {
        valorTotalBreakdown += (item.total_considerado || 0) * item.valor;
    });

    valorPagamentoInput.value = valorTotalBreakdown.toFixed(2);

    // Re-renderiza para limpar os campos 'pagar' e remover itens esgotados
    renderizarItensDivisao(itensAgrupadosDivisao);

    if (!pulandoFocus) {
        valorPagamentoInput.focus();
        valorPagamentoInput.select();
    }
}
