// ===============================
// MÓDULO: PAGAMENTO
// Modal de pagamento e finalização de comanda
// ===============================

// Variáveis de elementos DOM do Pagamento
let modalPagamento, btnFecharModalPagamento, tituloPagamentoModal, valorPagamentoInput, btnLancarPagamentoModal;
let tabelaPagamentosBody, pagTotalComandaEl, pagTotalPagoEl, pagSaldoDevedorEl, pagTrocoEl, btnFinalizarComandaModal;
let metodosButtons, btnVoltarDivisaoModal;

function carregarElementosPagamento() {
    modalPagamento = document.getElementById("modalPagamento");
    btnFecharModalPagamento = document.getElementById("btnFecharModalPagamento");
    tituloPagamentoModal = document.getElementById("tituloPagamentoModal");
    valorPagamentoInput = document.getElementById("valorPagamentoInput");
    btnLancarPagamentoModal = document.getElementById("btnLancarPagamentoModal");
    tabelaPagamentosBody = document.querySelector("#tabelaPagamentosModal tbody");
    pagTotalComandaEl = document.getElementById("pag-total-comanda");
    pagTotalPagoEl = document.getElementById("pag-total-pago");
    pagSaldoDevedorEl = document.getElementById("pag-saldo-devedor");
    pagTrocoEl = document.getElementById("pag-troco");
    btnFinalizarComandaModal = document.getElementById("btnFinalizarComandaModal");
    metodosButtons = document.querySelectorAll("#modalPagamento .metodo-btn");
    btnVoltarDivisaoModal = document.getElementById("btnVoltarDivisaoModal");
}

// ===============================
// FUNÇÕES PÚBLICAS
// ===============================

async function abrirModalPagamento(valorSugerido = null, itensBreakdown = null) {
    if (modalPagamento) modalPagamento.classList.remove("hidden");
    if (tituloPagamentoModal) tituloPagamentoModal.innerText = `Pagamento Comanda ${currentComandaNumero}`;
    itensSelecionadosParaPagamento = itensBreakdown;

    await carregarResumoPagamento(valorSugerido);
    await carregarPagamentosModal();

    formaPagamentoSelecionada = "Cartão Crédito";
    if (metodosButtons) metodosButtons.forEach(b => b.classList.toggle("active", b.dataset.forma === formaPagamentoSelecionada));

    setTimeout(() => {
        const btn =
            modalPagamento.querySelector(".metodo-btn.active") ||
            modalPagamento.querySelector(".metodo-btn");

        if (btn) btn.focus();
    }, 50);
}

async function carregarResumoPagamento(valorSugerido = null) {
    const data = await getResumoComanda(currentComandaNumero);
    totalComandaGlobal = data.total_itens;
    totalPagoGlobal = data.total_pago;
    saldoDevedorGlobal = Math.max(0, totalComandaGlobal - totalPagoGlobal);

    if (pagTotalComandaEl) pagTotalComandaEl.innerText = `R$ ${formatarMoeda(totalComandaGlobal)}`;
    if (pagTotalPagoEl) pagTotalPagoEl.innerText = `R$ ${formatarMoeda(totalPagoGlobal)}`;
    if (pagSaldoDevedorEl) pagSaldoDevedorEl.innerText = `R$ ${formatarMoeda(saldoDevedorGlobal)}`;

    if (valorPagamentoInput) {
        if (valorSugerido !== null) valorPagamentoInput.value = parseFloat(valorSugerido).toFixed(2);
        else valorPagamentoInput.value = saldoDevedorGlobal > 0.001 ? saldoDevedorGlobal.toFixed(2) : "0.00";
    }

    if (btnFinalizarComandaModal) {
        if (data.status === 'finalizada') {
            btnFinalizarComandaModal.disabled = true;
            btnFinalizarComandaModal.innerText = "Finalizado";
        } else {
            btnFinalizarComandaModal.disabled = false;
            btnFinalizarComandaModal.innerText = "Finalizar Comanda (F10)";
        }
    }

    atualizarTrocoPagamento();
}

function atualizarTrocoPagamento() {
    if (!pagTrocoEl) return;
    const valorDigitado = parseFloat(valorPagamentoInput ? valorPagamentoInput.value : 0) || 0;
    const troco = (formaPagamentoSelecionada === "Dinheiro" && valorDigitado > saldoDevedorGlobal)
        ? (valorDigitado - saldoDevedorGlobal)
        : 0;
    pagTrocoEl.innerText = `R$ ${formatarMoeda(troco)}`;
}

async function carregarPagamentosModal() {
    const pagamentos = await getPagamentosComanda(currentComandaNumero);
    if (tabelaPagamentosBody) {
        tabelaPagamentosBody.innerHTML = "";
        pagamentos.forEach(p => {
            const tr = document.createElement("tr");
            tr.innerHTML = `<td>${p.forma}</td><td style="text-align: right;">R$ ${formatarMoeda(p.valor)}</td><td style="text-align: center;"><button class="btn-remover-mini" onclick="removerPagamentoModal(${p.id})">×</button></td>`;
            tabelaPagamentosBody.appendChild(tr);
        });
    }
}

async function lancarPagamentoModal() {
    const v = parseFloat(valorPagamentoInput ? valorPagamentoInput.value : 0);
    if (isNaN(v) || v <= 0) return alert("Valor inválido");

    if (btnLancarPagamentoModal) btnLancarPagamentoModal.disabled = true;
    try {
        await addPagamento(currentComandaNumero, {
            forma: formaPagamentoSelecionada,
            valor: v,
            itens: itensSelecionadosParaPagamento
        });

        if (valorPagamentoInput) valorPagamentoInput.value = "";

        // Limpa breakdown acumulado após lançar
        itensSelecionadosParaPagamento = null;
        if (itensAgrupadosDivisao) {
            itensAgrupadosDivisao.forEach(i => {
                i.total_considerado = 0;
                i.itens_originais.forEach(orig => orig.quantidade_considerada = 0);
            });
        }
        if (totalSelecionadoItemEl) totalSelecionadoItemEl.innerText = "R$ 0,00";
        if (btnAdicionarAoPagamento) {
            btnAdicionarAoPagamento.dataset.totalRaw = "0";
            btnAdicionarAoPagamento.dataset.totalAcumulado = "0";
        }

        await carregarResumoPagamento();
        await carregarPagamentosModal();
        if (typeof carregarItensComanda === "function") {
            await carregarItensComanda();
        }

        // Verificar saldo restante e focar no elemento apropriado
        if (saldoDevedorGlobal > 0) {
            // Ainda há saldo a pagar - foco no método de pagamento
            const primeiroMetodo = modalPagamento ? modalPagamento.querySelector(".metodo-btn") : null;
            if (primeiroMetodo) primeiroMetodo.focus();
        } else {
            // Pagamento completo - foco no botão Finalizar
            const btnFinalizar = document.getElementById("btnFinalizarComandaModal");
            if (btnFinalizar) btnFinalizar.focus();
        }
        atualizarTrocoPagamento();
    } catch (error) {
        // Sincroniza estado para evitar inconsistência visual em caso de falha de rede.
        try {
            await carregarResumoPagamento();
            await carregarPagamentosModal();
            if (typeof carregarItensComanda === "function") {
                await carregarItensComanda();
            }
        } catch (_) { }
        alert(error.message || "Erro ao lançar pagamento");
    } finally {
        if (btnLancarPagamentoModal) btnLancarPagamentoModal.disabled = false;
    }
}

async function removerPagamentoModal(id) {
    if (!confirm("Remover este pagamento?")) return;
    await deletePagamento(id);
    await carregarResumoPagamento();
    await carregarPagamentosModal();
    if (typeof carregarItensComanda === "function") {
        await carregarItensComanda();
    }
}

async function finalizarComandaModal() {
    if (saldoDevedorGlobal > 0.01) {
        alert("Saldo devedor pendente: R$ " + saldoDevedorGlobal.toFixed(2) + "\nRealize o pagamento total antes de finalizar.");
        return;
    }

    // Pergunta se deseja imprimir o comprovante
    if (confirm("Deseja imprimir o comprovante de pagamento?")) {
        await imprimirResumoPagamento();
    }

    try {
        await finalizarComanda(currentComandaNumero);
        if (modalPagamento) modalPagamento.classList.add("hidden");
        if (modalComanda) modalComanda.classList.add("hidden");
        carregarDashboard();
        if (typeof focarCampoQuickComanda === "function") focarCampoQuickComanda();
    } catch (error) {
        alert(error.message || "Erro ao fechar comanda");
    }
}

function setupPagamentoListeners() {
    carregarElementosPagamento();

    if (btnFecharModalPagamento) {
        btnFecharModalPagamento.onclick = () => {
            // Verificar se há saldo devedor
            const saldoDevedorEl = document.getElementById("pag-saldo-devedor");
            const saldoDevedorText = saldoDevedorEl ? saldoDevedorEl.innerText : "R$ 0,00";
            const saldoDevedor = parseFloat(saldoDevedorText.replace("R$", "").replace(",", ".").trim()) || 0;

            if (modalPagamento) modalPagamento.classList.add("hidden");

            // Se ainda há valor a pagar, voltar para o modal da comanda
            if (saldoDevedor > 0) {
                const modalComanda = document.getElementById("modalComanda");
                if (modalComanda) {
                    modalComanda.classList.remove("hidden");
                    // Focar no campo de busca
                    setTimeout(() => {
                        const buscaCodigo = document.getElementById("buscaCodigo");
                        if (buscaCodigo) buscaCodigo.focus();
                    }, 100);
                }
            } else if (typeof focarCampoQuickComanda === "function") {
                focarCampoQuickComanda();
            }
        };
    }

    if (btnLancarPagamentoModal) btnLancarPagamentoModal.onclick = lancarPagamentoModal;
    if (valorPagamentoInput) valorPagamentoInput.onkeydown = e => { if (e.key === "Enter") lancarPagamentoModal(); };
    if (valorPagamentoInput) valorPagamentoInput.oninput = atualizarTrocoPagamento;
    if (btnFinalizarComandaModal) btnFinalizarComandaModal.onclick = finalizarComandaModal;

    if (btnVoltarDivisaoModal) {
        btnVoltarDivisaoModal.onclick = () => {
            if (modalPagamento) modalPagamento.classList.add("hidden");
            if (typeof abrirModalDividirItem === "function") abrirModalDividirItem();
        };
    }

    if (metodosButtons) {
        metodosButtons.forEach(btn => btn.onclick = () => {
            metodosButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            formaPagamentoSelecionada = btn.dataset.forma;
            atualizarTrocoPagamento();
            if (valorPagamentoInput) {
                valorPagamentoInput.focus();
                valorPagamentoInput.select();
            }
        });
    }
}

// Inicialização
document.addEventListener("DOMContentLoaded", setupPagamentoListeners);
