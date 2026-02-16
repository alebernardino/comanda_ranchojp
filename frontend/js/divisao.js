// ===============================
// MÓDULO: DIVISÃO
// Modal de divisão por item
// ===============================

// Variáveis de elementos DOM da Divisão
let modalDividirItem, tbodyDivisaoItens, totalSelecionadoItemEl, btnAdicionarAoPagamento, btnConsiderarSelecao, btnImprimirDivisao;

function carregarElementosDivisao() {
    modalDividirItem = document.getElementById("modalDividirItem");
    tbodyDivisaoItens = document.getElementById("tbodyDivisaoItens");
    totalSelecionadoItemEl = document.getElementById("totalSelecionadoItem");
    btnAdicionarAoPagamento = document.getElementById("btnAdicionarAoPagamento");
    btnConsiderarSelecao = document.getElementById("btnConsiderarSelecao");
    btnImprimirDivisao = document.getElementById("btnImprimirDivisao");
}

// ===============================
// FUNÇÕES PÚBLICAS
// ===============================

async function abrirModalDividirItem() {
    if (modalDividirItem) modalDividirItem.classList.remove("hidden");
    const tituloPartial = document.getElementById("tituloPartialPrint");
    if (tituloPartial) tituloPartial.innerText = `Comanda ${currentComandaNumero} | valor parcial`;
    let itens;
    try {
        itens = await getItensComanda(currentComandaNumero);
    } catch (error) {
        console.error("Erro ao carregar itens da comanda:", error);
        return;
    }

    const mapa = {};
    itens.forEach(i => {
        // Busca se este item físico já está "considerado" na seleção atual
        const jaConsid = (itensSelecionadosParaPagamento || []).find(x => x.id === i.id)?.quantidade || 0;

        if (!mapa[i.codigo]) {
            mapa[i.codigo] = {
                codigo: i.codigo,
                descricao: i.descricao,
                valor: i.valor,
                total_quantidade: i.quantidade,
                total_paga: i.quantidade_paga || 0,
                total_considerado: jaConsid,
                itens_originais: [{
                    id: i.id,
                    quantidade: i.quantidade,
                    quantidade_paga: i.quantidade_paga || 0,
                    quantidade_considerada: jaConsid
                }]
            };
        } else {
            mapa[i.codigo].total_quantidade += i.quantidade;
            mapa[i.codigo].total_paga += i.quantidade_paga || 0;
            mapa[i.codigo].total_considerado += jaConsid;
            mapa[i.codigo].itens_originais.push({
                id: i.id,
                quantidade: i.quantidade,
                quantidade_paga: i.quantidade_paga || 0,
                quantidade_considerada: jaConsid
            });
        }
    });

    itensAgrupadosDivisao = Object.values(mapa);
    renderizarTabelaDivisao();

    // Focar no primeiro campo "Considerar" disponível
    setTimeout(() => {
        const primeiroInput = document.querySelector("#tbodyDivisaoItens .qtd-pagar-item:not([disabled])");
        if (primeiroInput) {
            primeiroInput.focus();
            primeiroInput.select();
        }
    }, 50);
}

function renderizarTabelaDivisao() {
    if (!tbodyDivisaoItens) return;
    tbodyDivisaoItens.innerHTML = "";
    itensAgrupadosDivisao.forEach(item => {
        const jaConsiderado = item.total_considerado || 0;
        const pagoVisual = item.total_paga + jaConsiderado;
        const disponivelParaSelecionar = item.total_quantidade - pagoVisual;

        const tr = document.createElement("tr");
        tr.classList.add("item-divisao-row");
        if (disponivelParaSelecionar <= 0) tr.classList.add("zero-print");
        else tr.classList.add("zero-print"); // Começa como zero-print se o valor inicial for 0

        tr.innerHTML = `
      <td style="padding: 8px;">${item.codigo}</td>
      <td>${item.descricao}</td>
      <td style="text-align: center;">${item.total_quantidade}</td>
      <td style="text-align: center;">${pagoVisual.toFixed(0)}</td>
      <td style="text-align: center;" class="qtd-disponivel-modal">${disponivelParaSelecionar}</td>
      <td style="text-align: center;">
        <span class="print-only-qty" style="display:none;">0</span>
        <input type="number" value="0" min="0" max="${disponivelParaSelecionar}" class="qtd-pagar-item" style="width: 50px; text-align: center; margin: 0;" ${disponivelParaSelecionar <= 0 ? 'disabled' : ''}>
      </td>
      <td>R$ ${formatarMoeda(item.valor)}</td>
      <td class="subtotal-item">R$ 0,00</td>
    `;

        const input = tr.querySelector(".qtd-pagar-item");
        const printQty = tr.querySelector(".print-only-qty");
        const disponivelEl = tr.querySelector(".qtd-disponivel-modal");

        if (input) {
            input.oninput = () => {
                let val = parseInt(input.value) || 0;
                if (val > disponivelParaSelecionar) val = disponivelParaSelecionar;
                if (val < 0) val = 0;
                input.value = val;
                item.selecionado = val;

                // Controle de impressão
                if (val > 0) tr.classList.remove("zero-print");
                else tr.classList.add("zero-print");
                if (printQty) printQty.innerText = val;

                // Atualiza Restante Visualmente
                if (disponivelEl) {
                    disponivelEl.innerText = (disponivelParaSelecionar - val).toString();
                }

                tr.querySelector(".subtotal-item").innerText = `R$ ${formatarMoeda(val * item.valor)}`;
                atualizarTotalSelecionadoItem();
            };

            // Navegar com Enter para o próximo campo
            input.onkeydown = (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    const todosInputs = Array.from(document.querySelectorAll("#tbodyDivisaoItens .qtd-pagar-item:not([disabled])"));
                    const idx = todosInputs.indexOf(input);
                    if (idx < todosInputs.length - 1) {
                        todosInputs[idx + 1].focus();
                        todosInputs[idx + 1].select();
                    } else {
                        // Último campo: foco no botão "Considerar Seleção"
                        const btnConsiderar = document.getElementById("btnConsiderarSelecao");
                        if (btnConsiderar) btnConsiderar.focus();
                    }
                }
            };
        }
        tbodyDivisaoItens.appendChild(tr);
    });
    atualizarTotalSelecionadoItem();
}

function atualizarTotalSelecionadoItem() {
    let totalSelecionadoAgora = 0;
    let totalAcumulado = 0;
    itensAgrupadosDivisao.forEach(i => {
        totalSelecionadoAgora += (i.selecionado || 0) * i.valor;
        totalAcumulado += (i.total_considerado || 0) * i.valor;
    });
    // Exibe somente a seleção atual (momento atual da tela)
    if (totalSelecionadoItemEl) totalSelecionadoItemEl.innerText = `R$ ${formatarMoeda(totalSelecionadoAgora)}`;
    if (btnAdicionarAoPagamento) btnAdicionarAoPagamento.dataset.totalRaw = totalSelecionadoAgora;
    if (btnAdicionarAoPagamento) btnAdicionarAoPagamento.dataset.totalAcumulado = totalAcumulado;
}

async function considerarSelecao(silencioso = false) {
    const totalSelecionadoAgora = parseFloat(btnAdicionarAoPagamento.dataset.totalRaw || 0);
    if (totalSelecionadoAgora <= 0) {
        if (!silencioso) alert("Selecione pelo menos um item");
        return;
    }

    // Capturar itens selecionados ANTES de zerar para impressão
    const itensParaImprimir = [];
    itensAgrupadosDivisao.forEach(item => {
        const sel = item.selecionado || 0;
        if (sel > 0) {
            itensParaImprimir.push({
                codigo: item.codigo,
                descricao: item.descricao,
                quantidade: sel,
                valor: item.valor,
                subtotal: sel * item.valor
            });
        }
    });

    const breakdown = [];
    itensAgrupadosDivisao.forEach(item => {
        let sel = item.selecionado || 0;
        if (sel > 0) {
            item.itens_originais.forEach(orig => {
                if (sel <= 0) return;
                const disp = orig.quantidade - (orig.quantidade_paga || 0) - (orig.quantidade_considerada || 0);
                if (disp > 0) {
                    const pagar = Math.min(sel, disp);
                    breakdown.push({ id: orig.id, quantidade: pagar });
                    orig.quantidade_considerada = (orig.quantidade_considerada || 0) + pagar;
                    sel -= pagar;
                }
            });
            item.total_considerado = (item.total_considerado || 0) + (item.selecionado || 0);
            item.selecionado = 0;
        }
    });

    if (!itensSelecionadosParaPagamento) itensSelecionadosParaPagamento = [];
    breakdown.forEach(b => {
        const existente = itensSelecionadosParaPagamento.find(x => x.id === b.id);
        if (existente) existente.quantidade += b.quantidade;
        else itensSelecionadosParaPagamento.push(b);
    });

    let totalAcumuladoVal = 0;
    itensAgrupadosDivisao.forEach(i => {
        totalAcumuladoVal += (i.total_considerado || 0) * i.valor;
    });

    sessionStorage.setItem(`comanda_${currentComandaNumero}_selecao`, JSON.stringify(itensSelecionadosParaPagamento));

    btnAdicionarAoPagamento.dataset.totalAcumulado = totalAcumuladoVal;

    renderizarTabelaDivisao();
    if (typeof carregarItensComanda === "function") {
        await carregarItensComanda();
    }

    // Perguntar se quer imprimir
    if (!silencioso && confirm("Deseja imprimir o comprovante?")) {
        imprimirDivisaoAcao(itensParaImprimir, totalSelecionadoAgora);
    }
}

function setupDivisaoListeners() {
    carregarElementosDivisao();

    if (btnAdicionarAoPagamento) {
        btnAdicionarAoPagamento.onclick = async () => {
            const totalSelecionadoAgora = parseFloat(btnAdicionarAoPagamento.dataset.totalRaw || 0);

            // Se não tem nada selecionado agora nem acumulado antes, avisa
            if (totalSelecionadoAgora <= 0 && (!itensSelecionadosParaPagamento || itensSelecionadosParaPagamento.length === 0)) {
                return alert("Selecione itens");
            }

            if (totalSelecionadoAgora > 0) {
                // "Considera" o que está selecionado agora antes de abrir o pagamento
                await considerarSelecao(true);
            }

            const totalAcumuladoFinal = parseFloat(btnAdicionarAoPagamento.dataset.totalAcumulado || 0);

            if (modalDividirItem) modalDividirItem.classList.add("hidden");

            // Abre o modal de pagamento com o que foi acumulado
            if (typeof abrirModalPagamento === "function") {
                abrirModalPagamento(totalAcumuladoFinal, itensSelecionadosParaPagamento);
            }
        };
    }

    if (btnConsiderarSelecao) btnConsiderarSelecao.onclick = () => considerarSelecao(false);
    if (btnImprimirDivisao) btnImprimirDivisao.onclick = () => { if (typeof imprimirDivisaoAcao === "function") imprimirDivisaoAcao(); };
}

// ===============================
// EXPOSIÇÃO GLOBAL DAS FUNÇÕES
// ===============================
window.abrirModalDividirItem = abrirModalDividirItem;
window.renderizarTabelaDivisao = renderizarTabelaDivisao;
window.atualizarTotalSelecionadoItem = atualizarTotalSelecionadoItem;
window.considerarSelecao = considerarSelecao;
window.setupDivisaoListeners = setupDivisaoListeners;

// Inicialização
document.addEventListener("DOMContentLoaded", setupDivisaoListeners);
