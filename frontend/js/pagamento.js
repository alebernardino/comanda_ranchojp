// ===============================
// MÓDULO: PAGAMENTO
// Modal de pagamento e finalização de comanda
// ===============================

// Nota: Elementos DOM compartilhados (modalPagamento, btnFecharModalPagamento,
// tituloPagamentoModal, valorPagamentoInput, btnLancarPagamentoModal,
// tabelaPagamentosBody, pagTotalComandaEl, pagTotalPagoEl, pagSaldoDevedorEl,
// btnFinalizarComandaModal, metodosButtons) estão declarados no index.js

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
    const res = await fetch(`${API_URL}/comandas/${currentComandaNumero}/resumo`);
    const data = await res.json();
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
}

async function carregarPagamentosModal() {
    const res = await fetch(`${API_URL}/comandas/${currentComandaNumero}/pagamentos`);
    const pagamentos = await res.json();
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

    const res = await fetch(`${API_URL}/comandas/${currentComandaNumero}/pagamentos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forma: formaPagamentoSelecionada, valor: v, itens: itensSelecionadosParaPagamento })
    });

    if (res.ok) {
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
    } else {
        const err = await res.json(); alert(err.detail);
    }
}

async function removerPagamentoModal(id) {
    if (!confirm("Remover este pagamento?")) return;
    await fetch(`${API_URL}/pagamentos/${id}`, { method: "DELETE" });
    await carregarResumoPagamento();
    await carregarPagamentosModal();
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

    const res = await fetch(
        `${API_URL}/comandas/${currentComandaNumero}/fechar`,
        { method: "POST" }
    );

    if (!res.ok) {
        let msg = "Erro ao fechar comanda";
        try {
            const data = await res.json();
            if (data.detail) msg = data.detail;
        } catch (e) { }
        alert(msg);
        return;
    }

    if (modalPagamento) modalPagamento.classList.add("hidden");
    if (modalComanda) modalComanda.classList.add("hidden");
    carregarDashboard();
}

// ===============================
// EXPOSIÇÃO GLOBAL DAS FUNÇÕES
// ===============================
window.abrirModalPagamento = abrirModalPagamento;
window.carregarResumoPagamento = carregarResumoPagamento;
window.carregarPagamentosModal = carregarPagamentosModal;
window.lancarPagamentoModal = lancarPagamentoModal;
window.removerPagamentoModal = removerPagamentoModal;
window.finalizarComandaModal = finalizarComandaModal;
