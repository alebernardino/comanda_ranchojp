// ===============================
// MÓDULO: FECHAMENTO
// Tela de fechamento diário
// ===============================

// Variáveis de elementos DOM do Fechamento
let sectionFechamento, navFechamento, tbodyMaquinasFechamento;
let fechamentoDinheiroInput, fechamentoVoucherInput;
let totalFechamentoCredito, totalFechamentoDebito, totalFechamentoPix, totalFechamentoGeral;
let modalImpressaoFechamento, btnAdicionarMaquina;
let btnAbrirModalImpressaoFechamento, btnImprimirFechamentoFinal;

function carregarElementosFechamento() {
    sectionFechamento = document.getElementById("sectionFechamento");
    navFechamento = document.getElementById("navFechamento");
    tbodyMaquinasFechamento = document.getElementById("tbodyMaquinasFechamento");
    fechamentoDinheiroInput = document.getElementById("fechamentoDinheiroInput");
    fechamentoVoucherInput = document.getElementById("fechamentoVoucherInput");
    totalFechamentoCredito = document.getElementById("totalFechamentoCredito");
    totalFechamentoDebito = document.getElementById("totalFechamentoDebito");
    totalFechamentoPix = document.getElementById("totalFechamentoPix");
    totalFechamentoGeral = document.getElementById("totalFechamentoGeral");
    modalImpressaoFechamento = document.getElementById("modalImpressaoFechamento");
    btnAdicionarMaquina = document.getElementById("btnAdicionarMaquina");
    btnAbrirModalImpressaoFechamento = document.getElementById("btnAbrirModalImpressaoFechamento");
    btnImprimirFechamentoFinal = document.getElementById("btnImprimirFechamentoFinal");
}

// ===============================
// FUNÇÕES PÚBLICAS
// ===============================

function alternarParaFechamento() {
    // Esconde todas as outras seções conhecidas
    if (typeof sectionComandas !== 'undefined' && sectionComandas) sectionComandas.classList.add("hidden");
    if (typeof sectionProdutos !== 'undefined' && sectionProdutos) sectionProdutos.classList.add("hidden");
    if (document.getElementById("sectionColaboradores")) document.getElementById("sectionColaboradores").classList.add("hidden");
    if (document.getElementById("sectionClientes")) document.getElementById("sectionClientes").classList.add("hidden");
    if (document.getElementById("sectionEstoque")) document.getElementById("sectionEstoque").classList.add("hidden");
    if (document.getElementById("sectionConfiguracao")) document.getElementById("sectionConfiguracao").classList.add("hidden");
    if (document.getElementById("sectionUsuarios")) document.getElementById("sectionUsuarios").classList.add("hidden");
    if (document.getElementById("sectionFinanceiro")) document.getElementById("sectionFinanceiro").classList.add("hidden");
    if (document.getElementById("sectionRelatorios")) document.getElementById("sectionRelatorios").classList.add("hidden");
    if (document.getElementById("sectionFluxoCaixa")) document.getElementById("sectionFluxoCaixa").classList.add("hidden");

    if (sectionFechamento) {
        sectionFechamento.classList.remove("hidden");
    } else {
        console.error("Elemento sectionFechamento não encontrado!");
    }

    // Atualiza Menu
    if (typeof navDashboard !== 'undefined' && navDashboard) navDashboard.classList.remove("active");
    if (typeof navProdutosSessao !== 'undefined' && navProdutosSessao) navProdutosSessao.classList.remove("active");
    if (document.getElementById("navColaboradores")) document.getElementById("navColaboradores").classList.remove("active");
    if (document.getElementById("navClientes")) document.getElementById("navClientes").classList.remove("active");
    if (document.getElementById("navEstoque")) document.getElementById("navEstoque").classList.remove("active");
    if (document.getElementById("navConfiguracao")) document.getElementById("navConfiguracao").classList.remove("active");
    if (document.getElementById("navUsuarios")) document.getElementById("navUsuarios").classList.remove("active");
    if (document.getElementById("navFinanceiro")) document.getElementById("navFinanceiro").classList.remove("active");
    if (document.getElementById("navRelatorios")) document.getElementById("navRelatorios").classList.remove("active");
    const navFC = document.getElementById("navFluxoCaixa");
    if (navFC) navFC.classList.remove("active");

    if (navFechamento) navFechamento.classList.add("active");
}

async function imprimirFechamentoFinal() {
    const isVendas = document.getElementById("checkPrintVendas").checked;
    const isPagamentos = document.getElementById("checkPrintPagamentos").checked;
    const isSistema = document.getElementById("checkPrintRecebimentosSistema").checked;
    const isManual = document.getElementById("checkPrintRecebimentosManual").checked;

    try {
        const now = new Date();
        const hoje = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, '0') + "-" + String(now.getDate()).padStart(2, '0');
        const data = await getRelatorioVendas('dia', `${hoje}T00:00:00`, `${hoje}T23:59:59`, '');

        // Preparar dados de recebimentos manuais
        let valCred = 0, valDeb = 0, valPix = 0;
        document.querySelectorAll(".linha-maquina").forEach(row => {
            valCred += parseMoedaInput(row.querySelector(".f-credito").value);
            valDeb += parseMoedaInput(row.querySelector(".f-debito").value);
            valPix += parseMoedaInput(row.querySelector(".f-pix").value);
        });

        const valDin = fechamentoDinheiroInput ? parseMoedaInput(fechamentoDinheiroInput.value) : 0;
        const valVou = fechamentoVoucherInput ? parseMoedaInput(fechamentoVoucherInput.value) : 0;

        const recebimentosManuais = [
            { forma: "CARTÃO CRÉDITO", valor: valCred },
            { forma: "CARTÃO DÉBITO", valor: valDeb },
            { forma: "PIX", valor: valPix },
            { forma: "DINHEIRO", valor: valDin },
            { forma: "VOUCHER", valor: valVou }
        ];

        // Sempre tenta o fluxo central de impressão primeiro (serial/QZ/backend).
        const dataFormatada = `${now.toLocaleDateString("pt-BR")} ${now.toLocaleTimeString("pt-BR")}`;
<<<<<<< HEAD
        const vendas = isVendas
            ? data.geral
                .map(v => ({ descricao: v.descricao, quantidade: v.total_qtd }))
                .sort((a, b) => {
                    const qtdA = Number(a.quantidade) || 0;
                    const qtdB = Number(b.quantidade) || 0;
                    if (qtdA !== qtdB) return qtdB - qtdA;
                    return String(a.descricao || "").localeCompare(String(b.descricao || ""), "pt-BR");
                })
            : [];
=======
        const vendas = isVendas ? data.geral.map(v => ({ descricao: v.descricao, quantidade: v.total_qtd })) : [];
>>>>>>> 9099b41094357b03608056559d9d191b58d7a433
        const pagamentos = isPagamentos ? data.saidas.map(s => ({ fornecedor: s.fornecedor, total: s.total })) : [];
        const recebimentosSistema = isSistema ? data.fechamento.map(f => ({ forma: f.forma, total: f.total })) : [];
        const manuais = isManual ? recebimentosManuais : [];

        if (typeof imprimirFechamento === "function") {
            const ok = await imprimirFechamento(dataFormatada, vendas, pagamentos, recebimentosSistema, manuais);
            if (ok) {
                if (modalImpressaoFechamento) modalImpressaoFechamento.classList.add("hidden");
                return;
            }
        }

        // Fallback: impressão via navegador
        const printData = document.getElementById("printFechamentoData");
        if (printData) printData.innerText = `DATA: ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR")}`;

        const blocoVendas = document.getElementById("printBlocoVendas");
        const bodyVendas = document.getElementById("printBodyVendas");
        if (bodyVendas) {
            blocoVendas.style.display = isVendas ? "block" : "none";
            bodyVendas.innerHTML = "";
            if (isVendas) {
                const vendasOrdenadas = [...(data.geral || [])].sort((a, b) => {
                    const qtdA = Number(a.total_qtd) || 0;
                    const qtdB = Number(b.total_qtd) || 0;
                    if (qtdA !== qtdB) return qtdB - qtdA;
                    return String(a.descricao || "").localeCompare(String(b.descricao || ""), "pt-BR");
                });
                vendasOrdenadas.forEach(v => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `<td style="padding: 2px 0;">${v.descricao}</td><td style="text-align: right;">${v.total_qtd}</td>`;
                    bodyVendas.appendChild(tr);
                });
            }
        }

        const blocoPagamentos = document.getElementById("printBlocoPagamentos");
        const bodyPagamentos = document.getElementById("printBodyPagamentos");
        if (bodyPagamentos) {
            blocoPagamentos.style.display = isPagamentos ? "block" : "none";
            bodyPagamentos.innerHTML = "";
            if (isPagamentos) {
                data.saidas.forEach(s => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `<td style="padding: 2px 0;">${s.fornecedor}</td><td style="text-align: right;">R$ ${formatarMoeda(s.total)}</td>`;
                    bodyPagamentos.appendChild(tr);
                });
            }
        }

        const blocoSistema = document.getElementById("printBlocoRecebimentosSistema");
        const bodySistema = document.getElementById("printBodyRecebimentosSistema");
        if (bodySistema) {
            blocoSistema.style.display = isSistema ? "block" : "none";
            bodySistema.innerHTML = "";
            if (isSistema) {
                let totalSistema = 0;
                data.fechamento.forEach(f => {
                    totalSistema += Number(f.total || 0);
                    const tr = document.createElement("tr");
                    tr.innerHTML = `<td style="padding: 2px 0;">${f.forma}</td><td style="text-align: right;">R$ ${formatarMoeda(f.total)}</td>`;
                    bodySistema.appendChild(tr);
                });
                const trTotal = document.createElement("tr");
                trTotal.innerHTML = `<td style="padding: 4px 0; font-weight: 800;">TOTAL</td><td style="text-align: right; font-weight: 800;">R$ ${formatarMoeda(totalSistema)}</td>`;
                bodySistema.appendChild(trTotal);
            }
        }

        const blocoManual = document.getElementById("printBlocoRecebimentosManual");
        const bodyManual = document.getElementById("printBodyRecebimentosManual");
        if (bodyManual) {
            blocoManual.style.display = isManual ? "block" : "none";
            bodyManual.innerHTML = "";
            if (isManual) {
                recebimentosManuais.forEach(item => {
                    if (item.valor > 0) {
                        const tr = document.createElement("tr");
                        tr.innerHTML = `<td style="padding: 2px 0;">${item.forma}</td><td style="text-align: right;">R$ ${formatarMoeda(item.valor)}</td>`;
                        bodyManual.appendChild(tr);
                    }
                });
            }
        }

        document.body.classList.add("printing-closure");
        setTimeout(() => {
            window.print();
            document.body.classList.remove("printing-closure");
            if (modalImpressaoFechamento) modalImpressaoFechamento.classList.add("hidden");
        }, 500);
    } catch (err) {
        console.error("Erro no fechamento:", err);
        alert("Erro ao preparar o fechamento.");
    }
}

function formatarCampoMoeda(input) {
    if (!input.value) return;
    let valor = input.value.replace(/\D/g, "");
    if (!valor) { input.value = ""; return; }
    valor = (parseInt(valor) / 100).toFixed(2);
    input.value = "R$ " + formatarMoeda(parseFloat(valor));
}

function parseMoedaInput(texto) {
    if (!texto) return 0;
    let limpo = texto.replace("R$ ", "").replace(/\./g, "").replace(",", ".");
    return parseFloat(limpo) || 0;
}

function adicionarLinhaFechamento(label = "", c = 0, d = 0, p = 0) {
    if (!tbodyMaquinasFechamento) return;

    const tr = document.createElement("tr");
    tr.className = "linha-maquina";
    tr.classList.add("table-row");

    tr.innerHTML = `
    <td style="padding: 10px;"><input type="text" class="f-label" value="${label}" placeholder="Ex: Cielo, Stone..." style="width:100%; border:1px solid #e2e8f0; padding:8px; border-radius:6px; font-weight:700;"></td>
    <td style="padding: 10px;"><input type="text" class="f-moeda f-credito" value="${c ? "R$ " + formatarMoeda(c) : ""}" placeholder="R$ 0,00" style="width:100%; border:1px solid #e2e8f0; padding:8px; border-radius:6px; font-weight:700; text-align:right;"></td>
    <td style="padding: 10px;"><input type="text" class="f-moeda f-debito" value="${d ? "R$ " + formatarMoeda(d) : ""}" placeholder="R$ 0,00" style="width:100%; border:1px solid #e2e8f0; padding:8px; border-radius:6px; font-weight:700; text-align:right;"></td>
    <td style="padding: 10px;"><input type="text" class="f-moeda f-pix" value="${p ? "R$ " + formatarMoeda(p) : ""}" placeholder="R$ 0,00" style="width:100%; border:1px solid #e2e8f0; padding:8px; border-radius:6px; font-weight:700; text-align:right;"></td>
    <td style="padding: 10px; text-align:center;"><button class="btn-remove-linha-fech" style="background:#fee2e2; color:#ef4444; border:none; border-radius:50%; width:28px; height:28px; cursor:pointer;" title="Remover">×</button></td>
  `;

    tbodyMaquinasFechamento.appendChild(tr);

    // Vincular máscara, cálculos e navegação por Enter
    const inputs = tr.querySelectorAll("input");
    inputs.forEach((inp, idx) => {
        if (inp.classList.contains("f-moeda")) {
            // Aplica máscara a cada digitação
            inp.addEventListener("input", () => {
                formatarCampoMoeda(inp);
                atualizarTotaisFechamento();
            });

            // Garante formatação ao sair do campo
            inp.addEventListener("blur", () => {
                if (inp.value && inp.value.trim() !== "") {
                    formatarCampoMoeda(inp);
                }
            });

            // Ao focar, seleciona tudo para facilitar edição
            inp.addEventListener("focus", () => {
                inp.select();
            });
        }

        inp.onkeydown = (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                const todosInps = Array.from(document.querySelectorAll("#tbodyMaquinasFechamento input"));
                const atualIdx = todosInps.indexOf(inp);

                if (atualIdx < todosInps.length - 1) {
                    todosInps[atualIdx + 1].focus();
                } else {
                    // Ir para o campo de dinheiro
                    if (fechamentoDinheiroInput) fechamentoDinheiroInput.focus();
                }
            }
        };
    });

    tr.querySelector(".btn-remove-linha-fech").onclick = () => {
        tr.remove();
        atualizarTotaisFechamento();
    };

    atualizarTotaisFechamento();
}

function atualizarTotaisFechamento() {
    let sc = 0, sd = 0, sp = 0;
    document.querySelectorAll(".linha-maquina").forEach(row => {
        sc += parseMoedaInput(row.querySelector(".f-credito").value);
        sd += parseMoedaInput(row.querySelector(".f-debito").value);
        sp += parseMoedaInput(row.querySelector(".f-pix").value);
    });

    // Dinheiro e Voucher vêm dos campos fixos
    const sdi = fechamentoDinheiroInput ? parseMoedaInput(fechamentoDinheiroInput.value) : 0;
    const sv = fechamentoVoucherInput ? parseMoedaInput(fechamentoVoucherInput.value) : 0;

    if (totalFechamentoCredito) totalFechamentoCredito.innerText = `R$ ${formatarMoeda(sc)}`;
    if (totalFechamentoDebito) totalFechamentoDebito.innerText = `R$ ${formatarMoeda(sd)}`;
    if (totalFechamentoPix) totalFechamentoPix.innerText = `R$ ${formatarMoeda(sp)}`;

    // Total geral = maquininhas + dinheiro + voucher
    const totalGeral = sc + sd + sp + sdi + sv;
    if (totalFechamentoGeral) totalFechamentoGeral.innerText = `R$ ${formatarMoeda(totalGeral)}`;
}

// ===============================
// INICIALIZAÇÃO
// ===============================
function setupFechamentoListeners() {
    carregarElementosFechamento();

    if (btnAdicionarMaquina) btnAdicionarMaquina.onclick = () => adicionarLinhaFechamento();

    // Vincular campos de dinheiro e voucher fixos
    if (fechamentoDinheiroInput) {
        fechamentoDinheiroInput.addEventListener("input", () => {
            formatarCampoMoeda(fechamentoDinheiroInput);
            atualizarTotaisFechamento();
        });
        fechamentoDinheiroInput.addEventListener("focus", () => fechamentoDinheiroInput.select());
        fechamentoDinheiroInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                if (fechamentoVoucherInput) fechamentoVoucherInput.focus();
            }
        });
    }

    if (fechamentoVoucherInput) {
        fechamentoVoucherInput.addEventListener("input", () => {
            formatarCampoMoeda(fechamentoVoucherInput);
            atualizarTotaisFechamento();
        });
        fechamentoVoucherInput.addEventListener("focus", () => fechamentoVoucherInput.select());
        fechamentoVoucherInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                if (btnAbrirModalImpressaoFechamento) btnAbrirModalImpressaoFechamento.focus();
            }
        });
    }

    // Adiciona duas linhas por padrão (limpando antes para evitar duplicidade)
    if (tbodyMaquinasFechamento) {
        tbodyMaquinasFechamento.innerHTML = "";
        adicionarLinhaFechamento("MÁQUINA 01");
        adicionarLinhaFechamento("MÁQUINA 02");
    }

    // Botões de Impressão (antes no index.js)
    if (btnAbrirModalImpressaoFechamento) {
        btnAbrirModalImpressaoFechamento.onclick = () => {
            if (modalImpressaoFechamento) {
                modalImpressaoFechamento.classList.remove("hidden");
                // Focar no botão de imprimir após abrir o modal
                setTimeout(() => {
                    if (btnImprimirFechamentoFinal) btnImprimirFechamentoFinal.focus();
                }, 50);
            }
        };
    }

    if (btnImprimirFechamentoFinal) btnImprimirFechamentoFinal.onclick = imprimirFechamentoFinal;
}

// Para retrocompatibilidade se carregado diretamente
document.addEventListener("DOMContentLoaded", setupFechamentoListeners);

// ===============================
// EXPOSIÇÃO GLOBAL DAS FUNÇÕES
// ===============================
window.setupFechamentoListeners = setupFechamentoListeners;
window.alternarParaFechamento = alternarParaFechamento;
window.imprimirFechamentoFinal = imprimirFechamentoFinal;
window.formatarCampoMoeda = formatarCampoMoeda;
window.parseMoedaInput = parseMoedaInput;
window.adicionarLinhaFechamento = adicionarLinhaFechamento;
window.atualizarTotaisFechamento = atualizarTotaisFechamento;
