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

let formaSelecionada = "Dinheiro";
let saldoDevedorGlobal = 0;
let totalItensGlobal = 0;
let totalPagoGlobal = 0;

// Inicialização
function init() {
    tituloPagamento.innerText = `Pagamento Comanda ${numero}`;
    carregarResumo();
    carregarPagamentos();
    valorPagamentoInput.focus();

    // 👉 foco no primeiro botão de método
    if (metodosButtons.length > 0) {
        metodosButtons[0].focus();
    }
}

init();

// Formatação
function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

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


        // Atualiza valor padrão do input se houver saldo
        if (saldoDevedorGlobal > 0 && valorPagamentoInput.value === "") {
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
    btn.addEventListener("click", () => {
        metodosButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        formaSelecionada = btn.dataset.forma;

        // Foca e seleciona o valor para facilitar a edição rápida
        valorPagamentoInput.focus();
        valorPagamentoInput.select();
    });
});

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
                valor: valor
            })
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.detail || "Erro ao lançar pagamento");
        }

        valorPagamentoInput.value = "";
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

        alert("Comanda finalizada com sucesso!");
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
    if (e.key === "Escape") btnVoltar.click();
    if (e.key === "F1" && !btnFinalizarComanda.disabled) finalizarComanda();
});
