// relatorios.js

const sectionRelatorios = document.getElementById("sectionRelatorios");
const navRelatorios = document.getElementById("navRelatorios");

let chartVendasInstance = null;
let chartFluxoInstance = null;

// Estados para dados analíticos e ordenação
let dadosGeralVendas = [];
let sortDirecaoGeral = 'desc';

let dadosAnaliticoVendas = [];
let sortDirecaoVendas = 'desc';

let dadosComandasVendas = [];
let sortDirecaoComandas = 'desc';

let dadosAnaliticoFluxo = { entradas: [], saidas: [] };
let sortDirecaoFluxo = { entradas: 'desc', saidas: 'desc' };

async function carregarRelatorioVendas(periodo = 'dia', btn = null) {
    if (!window.currentPeriodoVendas) window.currentPeriodoVendas = 'dia';
    if (typeof periodo === 'string') window.currentPeriodoVendas = periodo;
    else periodo = window.currentPeriodoVendas;

    if (btn) {
        const btns = btn.parentElement.querySelectorAll('.btn-small-tab');
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }

    let dataInicio = document.getElementById("relVendasInicio").value;
    let dataFim = document.getElementById("relVendasFim").value;
    let busca = document.getElementById("relVendasBusca").value.trim();

    if (!dataInicio || !dataFim) {
        configurarDatasPadraoRel();
        dataInicio = document.getElementById("relVendasInicio").value;
        dataFim = document.getElementById("relVendasFim").value;
    }

    let url = `/relatorios/vendas?periodo=${periodo}`;
    if (dataInicio) url += `&data_inicio=${encodeURIComponent(dataInicio + "T00:00:00")}`;
    if (dataFim) url += `&data_fim=${encodeURIComponent(dataFim + "T23:59:59")}`;
    if (busca) url += `&busca=${encodeURIComponent(busca)}`;

    try {
        const data = await apiGet(url);
        if (!data) return;

        dadosGeralVendas = data.geral || [];
        renderizarTabelaVendas(dadosGeralVendas);
        renderizarGraficoVendas(dadosGeralVendas);

        dadosAnaliticoVendas = data.analitico || [];
        renderizarAnaliticoVendas(dadosAnaliticoVendas);

        dadosComandasVendas = data.comandas || [];
        renderizarComandasVendas(dadosComandasVendas);

        const dadosFechamento = data.fechamento || [];
        renderizarFechamentoVendas(dadosFechamento);

        const dadosSaidas = data.saidas || [];
        renderizarPagamentosVendas(dadosSaidas);

        console.log("Relatório de vendas carregado com sucesso.");
    } catch (err) {
        console.error("Erro ao carregar relatório de vendas:", err);
    }
}


function ordenarGeralVendas(campo) {
    sortDirecaoGeral = sortDirecaoGeral === 'asc' ? 'desc' : 'asc';
    dadosGeralVendas.sort((a, b) => {
        let valA = a[campo];
        let valB = b[campo];

        // Se for string, converter para minúsculo para ordenação correta
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA === valB) return 0;
        if (sortDirecaoGeral === 'asc') return valA > valB ? 1 : -1;
        return valA < valB ? 1 : -1;
    });
    renderizarTabelaVendas(dadosGeralVendas);
    renderizarGraficoVendas(dadosGeralVendas);
}

function renderizarTabelaVendas(dados) {
    const tbody = document.getElementById("tabelaRelVendasBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    let totalQtd = 0;
    let totalValor = 0;

    dados.forEach(d => {
        totalQtd += d.total_qtd;
        totalValor += d.total_valor;

        const tr = document.createElement("tr");
        tr.style.borderBottom = "1px solid #f1f5f9";
        tr.innerHTML = `
            <td style="padding: 10px; font-weight: 500;">${d.descricao}</td>
            <td style="text-align: center;">${d.total_qtd}</td>
            <td style="text-align: right; font-weight: 700; padding-right: 10px;">R$ ${formatarMoeda(d.total_valor)}</td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById("totalRelVendasQtd").innerText = totalQtd;
    document.getElementById("totalRelVendasValor").innerText = `R$ ${formatarMoeda(totalValor)}`;
}

function renderizarGraficoVendas(dadosGeral) {
    const ctx = document.getElementById('chartVendas').getContext('2d');

    // Pegar top 10 produtos mais vendidos para o gráfico não ficar poluído
    const topDados = [...dadosGeral].sort((a, b) => b.total_qtd - a.total_qtd).slice(0, 10);

    const labels = topDados.map(d => d.descricao);
    const quantidades = topDados.map(d => d.total_qtd);

    if (chartVendasInstance) chartVendasInstance.destroy();

    // Registrar o plugin de datalabels apenas para este gráfico se necessário
    if (typeof ChartDataLabels !== 'undefined') {
        Chart.register(ChartDataLabels);
    }

    chartVendasInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Quantidade Vendida',
                    data: quantidades,
                    backgroundColor: '#10b981',
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: '#059669'
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Quantidade' },
                    grid: { display: false }
                },
                x: {
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { display: false },
                title: { display: true, text: 'Top 10 Produtos (Quantidade)' },
                datalabels: {
                    anchor: 'end',
                    align: 'top',
                    formatter: Math.round,
                    font: {
                        weight: 'bold',
                        size: 11
                    },
                    color: '#059669'
                }
            }
        }
    });
}

async function carregarRelatorioFluxo(periodo = 'dia', btn = null) {
    if (!window.currentPeriodoFluxo) window.currentPeriodoFluxo = 'dia';
    if (typeof periodo === 'string') window.currentPeriodoFluxo = periodo;
    else periodo = window.currentPeriodoFluxo;

    if (btn) {
        const btns = btn.parentElement.querySelectorAll('.btn-small-tab');
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }

    let dInicio = document.getElementById("relFluxoInicio").value;
    let dFim = document.getElementById("relFluxoFim").value;

    if (!dInicio || !dFim) {
        configurarDatasPadraoFluxo();
        dInicio = document.getElementById("relFluxoInicio").value;
        dFim = document.getElementById("relFluxoFim").value;
    }

    try {
        let url = `/relatorios/fluxo-caixa?periodo=${periodo}`;
        if (dInicio) url += `&data_inicio=${encodeURIComponent(dInicio + "T00:00:00")}`;
        if (dFim) url += `&data_fim=${encodeURIComponent(dFim + "T23:59:59")}`;

        const data = await apiGet(url);
        if (!data) return;

        renderizarPivotsFluxo(data.pivot_entradas, 'entradas', periodo);
        renderizarPivotsFluxo(data.pivot_saidas, 'saidas', periodo);

        dadosAnaliticoFluxo.entradas = data.analitico_entradas;
        dadosAnaliticoFluxo.saidas = data.analitico_saidas;
        renderizarAnaliticoFluxo(dadosAnaliticoFluxo.entradas, dadosAnaliticoFluxo.saidas);

        renderizarFechamentoFluxo(data.fechamento_entradas || [], data.fechamento_saidas || []);
    } catch (err) {
        console.error("Erro ao carregar fluxo de caixa:", err);
    }
}

function renderizarPivotsFluxo(dados, tipo, periodo) {
    const tableId = tipo === 'entradas' ? 'tabelaPivotEntradas' : 'tabelaPivotSaidas';
    const keyCat = tipo === 'entradas' ? 'forma' : 'nome';

    const table = document.getElementById(tableId);
    if (!table) return;
    table.innerHTML = "";

    if (!dados || dados.length === 0) {
        table.innerHTML = "<tr><td style='padding:20px; color:#64748b;'>Sem dados para o período selecionado.</td></tr>";
        return;
    }

    // 1. Extrair todas as datas e todas as categorias únicas
    const todasDatas = [...new Set(dados.map(d => d.tempo))].sort();
    const todasCategorias = [...new Set(dados.map(d => d[keyCat]))].sort();

    // 2. Criar cabeçalho
    const thead = document.createElement("thead");
    thead.style.background = "#f8fafc";
    let headerRow = `<tr style="border-bottom: 2px solid #e2e8f0;">
        <th style="padding: 12px; text-align: left; border-right: 1px solid #f1f5f9; position: sticky; left: 0; background: #f8fafc; z-index: 5;">DATA / PERÍODO</th>`;

    todasCategorias.forEach(cat => {
        headerRow += `<th style="padding: 12px; text-align: right; border-right: 1px solid #f1f5f9; min-width: 100px;">${cat}</th>`;
    });
    headerRow += `<th style="padding: 12px; text-align: right; font-weight: 800; background: #f1f5f9;">TOTAL</th></tr>`;
    thead.innerHTML = headerRow;
    table.appendChild(thead);

    // 3. Criar corpo
    const tbody = document.createElement("tbody");
    const totaisColunas = {};
    let totalGeral = 0;

    todasDatas.forEach(data => {
        // Formatar label da data conforme o período para as linhas
        let labelData = data;
        if (periodo === 'semana') {
            const parts = data.split('-');
            const dIni = new Date(parts[0], parts[1] - 1, parts[2]);
            const dFim = new Date(dIni);
            dFim.setDate(dIni.getDate() + 6);

            const pad = (n) => n.toString().padStart(2, '0');
            labelData = `${pad(dIni.getDate())}/${pad(dIni.getMonth() + 1)} à ${pad(dFim.getDate())}/${pad(dFim.getMonth() + 1)}/${dFim.getFullYear().toString().slice(-2)}`;
        }
        if (periodo === 'mes') {
            const [ano, mes] = data.split('-');
            const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            labelData = meses[parseInt(mes) - 1] + '/' + ano.slice(-2);
        }

        let rowHtml = `<tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 12px; font-weight: 600; border-right: 1px solid #f1f5f9; background: #fdfdfd; position: sticky; left: 0; z-index: 1;">${labelData}</td>`;

        let totalLinha = 0;
        todasCategorias.forEach(cat => {
            const item = dados.find(d => d.tempo === data && d[keyCat] === cat);
            const valor = item ? item.total : 0;
            rowHtml += `<td style="padding: 12px; text-align: right; border-right: 1px solid #f1f5f9;">${valor > 0 ? 'R$ ' + formatarMoeda(valor) : '-'}</td>`;

            totalLinha += valor;
            totaisColunas[cat] = (totaisColunas[cat] || 0) + valor;
        });

        const corTotal = tipo === 'entradas' ? '#10b981' : '#ef4444';
        rowHtml += `<td style="padding: 12px; text-align: right; font-weight: 800; background: #f8fafc; color: ${corTotal};">R$ ${formatarMoeda(totalLinha)}</td></tr>`;
        tbody.innerHTML += rowHtml;
        totalGeral += totalLinha;
    });
    table.appendChild(tbody);

    // 4. Criar rodapé (Totais por Coluna)
    const tfoot = document.createElement("tfoot");
    tfoot.style.background = "#f1f5f9";
    tfoot.style.fontWeight = "800";
    let footerRow = `<tr style="border-top: 2px solid #e2e8f0;">
        <td style="padding: 12px; border-right: 1px solid #e2e8f0; position: sticky; left: 0; background: #f1f5f9;">TOTAL GERAL</td>`;

    todasCategorias.forEach(cat => {
        footerRow += `<td style="padding: 12px; text-align: right; border-right: 1px solid #e2e8f0;">R$ ${formatarMoeda(totaisColunas[cat] || 0)}</td>`;
    });
    footerRow += `<td style="padding: 12px; text-align: right; background: #e2e8f0;">R$ ${formatarMoeda(totalGeral)}</td></tr>`;
    tfoot.innerHTML = footerRow;
    table.appendChild(tfoot);
}

function alternarSubAbaVendas(sub, btn) {
    const divGeral = document.getElementById("subAbaVendasGeral");
    const divAnalitico = document.getElementById("subAbaVendasAnalitico");
    const divComandas = document.getElementById("subAbaVendasComandas");
    const divFechamento = document.getElementById("subAbaVendasFechamento");
    const divPagamentos = document.getElementById("subAbaVendasPagamentos");
    if (!divGeral || !divAnalitico || !divComandas || !divFechamento || !divPagamentos) return;

    const btns = btn.parentElement.querySelectorAll('button');
    btns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    divGeral.classList.add("hidden");
    divAnalitico.classList.add("hidden");
    divComandas.classList.add("hidden");
    divFechamento.classList.add("hidden");
    divPagamentos.classList.add("hidden");

    if (sub === 'geral') {
        divGeral.classList.remove("hidden");
        if (divAgrupamento) divAgrupamento.classList.remove("hidden");
    } else if (sub === 'analitico') {
        divAnalitico.classList.remove("hidden");
        if (divAgrupamento) divAgrupamento.classList.add("hidden");
    } else if (sub === 'comandas') {
        divComandas.classList.remove("hidden");
        if (divAgrupamento) divAgrupamento.classList.add("hidden");
    } else if (sub === 'fechamento') {
        divFechamento.classList.remove("hidden");
        if (divAgrupamento) divAgrupamento.classList.add("hidden");
    } else if (sub === 'pagamentos') {
        divPagamentos.classList.remove("hidden");
        if (divAgrupamento) divAgrupamento.classList.add("hidden");
    }
}

function ordenarAnaliticoVendas(campo) {
    sortDirecaoVendas = sortDirecaoVendas === 'asc' ? 'desc' : 'asc';
    dadosAnaliticoVendas.sort((a, b) => {
        const valA = a[campo];
        const valB = b[campo];
        if (sortDirecaoVendas === 'asc') return valA > valB ? 1 : -1;
        return valA < valB ? 1 : -1;
    });
    renderizarAnaliticoVendas(dadosAnaliticoVendas);
}

function renderizarAnaliticoVendas(analitico) {
    const tbody = document.getElementById("tabelaRelVendasAnaliticoBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    analitico.forEach(item => {
        const tr = document.createElement("tr");
        tr.style.borderBottom = "1px solid #f1f5f9";
        const dataObj = item.data ? new Date(item.data) : null;
        const dataStr = dataObj ? dataObj.toLocaleString("pt-BR", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
        tr.innerHTML = `
            <td style="padding: 10px;">${dataStr}</td>
            <td style="padding: 10px; text-align: center; color: #64748b; font-weight: 700;">#${item.comanda_numero || '-'}</td>
            <td style="padding: 10px; font-weight: 500;">${item.descricao}</td>
            <td style="padding: 10px; text-align: center;">${item.quantidade}</td>
            <td style="padding: 10px; text-align: right; font-weight: 700; color: #3b82f6;">R$ ${formatarMoeda(item.valor)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function ordenarComandasVendas(campo) {
    sortDirecaoComandas = sortDirecaoComandas === 'asc' ? 'desc' : 'asc';
    dadosComandasVendas.sort((a, b) => {
        const valA = a[campo];
        const valB = b[campo];
        if (valA === valB) return 0;
        if (sortDirecaoComandas === 'asc') return valA > valB ? 1 : -1;
        return valA < valB ? 1 : -1;
    });
    renderizarComandasVendas(dadosComandasVendas);
}

function renderizarComandasVendas(comandas) {
    const tbody = document.getElementById("tabelaRelVendasComandasBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    comandas.forEach(c => {
        const tr = document.createElement("tr");
        tr.style.borderBottom = "1px solid #f1f5f9";
        // Mostrar data e hora (hora:minuto)
        const dataObj = c.data ? new Date(c.data) : null;
        const dataStr = dataObj ? dataObj.toLocaleString("pt-BR", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
        const formasStr = c.formas ? c.formas.replace(/,/g, ' + ') : '-';
        tr.innerHTML = `
            <td style="padding: 10px;">${dataStr}</td>
            <td style="padding: 10px; text-align: center; font-weight: 700; color: #64748b;">#${c.numero}</td>
            <td style="padding: 10px; font-size: 0.85rem; color: #64748b;">${formasStr}</td>
            <td style="padding: 10px; text-align: right; font-weight: 800; color: #10b981;">R$ ${formatarMoeda(c.total)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderizarFechamentoVendas(fechamento) {
    const tbody = document.getElementById("tabelaRelVendasFechamentoBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    let totalGeral = 0;

    fechamento.forEach(f => {
        totalGeral += f.total;
        const tr = document.createElement("tr");
        tr.style.borderBottom = "1px solid #f1f5f9";
        tr.innerHTML = `
            <td style="padding: 10px; font-weight: 500;">${f.forma}</td>
            <td style="padding: 10px; text-align: right; font-weight: 800; color: #10b981;">R$ ${formatarMoeda(f.total)}</td>
        `;
        tbody.appendChild(tr);
    });

    const elTotal = document.getElementById("totalRelVendasFechamentoValor");
    if (elTotal) elTotal.innerText = `R$ ${formatarMoeda(totalGeral)}`;
}

function renderizarPagamentosVendas(saidas) {
    const tbody = document.getElementById("tabelaRelVendasPagamentosBody");
    if (!tbody) return;

    tbody.innerHTML = "";
    let totalGeral = 0;

    saidas.forEach(s => {
        totalGeral += s.total;
        const tr = document.createElement("tr");
        tr.style.borderBottom = "1px solid #f1f5f9";

        tr.innerHTML = `
            <td style="padding: 10px; font-weight: 500;">${s.fornecedor || 'N/A'}</td>
            <td style="padding: 10px; text-align: right; font-weight: 800; color: #ef4444;">R$ ${formatarMoeda(s.total)}</td>
        `;
        tbody.appendChild(tr);
    });

    const elTotal = document.getElementById("totalRelVendasPagamentosValor");
    if (elTotal) elTotal.innerText = `R$ ${formatarMoeda(totalGeral)}`;
}

function alternarSubAbaFluxo(sub, btn) {
    const divGeral = document.getElementById("subAbaFluxoGeral");
    const divAnalitico = document.getElementById("subAbaFluxoAnalitico");
    const divFechamento = document.getElementById("subAbaFluxoFechamento");
    const divAgrupamento = document.getElementById("containerAgrupamentoFluxo");
    if (!divGeral || !divAnalitico || !divFechamento) return;

    const btns = btn.parentElement.querySelectorAll('button');
    btns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    divGeral.classList.add("hidden");
    divAnalitico.classList.add("hidden");
    divFechamento.classList.add("hidden");

    if (sub === 'geral') {
        divGeral.classList.remove("hidden");
        if (divAgrupamento) divAgrupamento.classList.remove("hidden");
    } else if (sub === 'analitico') {
        divAnalitico.classList.remove("hidden");
        if (divAgrupamento) divAgrupamento.classList.add("hidden");
    } else if (sub === 'fechamento') {
        divFechamento.classList.remove("hidden");
        if (divAgrupamento) divAgrupamento.classList.add("hidden");
    }
}

function renderizarFechamentoFluxo(entradas, saidas) {
    const tbodyE = document.getElementById("tabelaFechamentoFluxoEntradasBody");
    const tbodyS = document.getElementById("tabelaFechamentoFluxoSaidasBody");
    if (!tbodyE || !tbodyS) return;

    tbodyE.innerHTML = "";
    tbodyS.innerHTML = "";

    let totalE = 0;
    let totalS = 0;

    entradas.forEach(e => {
        totalE += e.total;
        const tr = document.createElement("tr");
        tr.style.borderBottom = "1px solid #f1f5f9";
        tr.innerHTML = `
            <td style="padding: 10px; font-weight: 500;">${e.forma}</td>
            <td style="padding: 10px; text-align: right; font-weight: 800; color: #10b981;">R$ ${formatarMoeda(e.total)}</td>
        `;
        tbodyE.appendChild(tr);
    });

    saidas.forEach(s => {
        totalS += s.total;
        const tr = document.createElement("tr");
        tr.style.borderBottom = "1px solid #f1f5f9";
        tr.innerHTML = `
            <td style="padding: 10px; font-weight: 500;">${s.forma}</td>
            <td style="padding: 10px; text-align: right; font-weight: 800; color: #ef4444;">R$ ${formatarMoeda(s.total)}</td>
        `;
        tbodyS.appendChild(tr);
    });

    document.getElementById("totalFechamentoFluxoEntradas").innerText = `R$ ${formatarMoeda(totalE)}`;
    document.getElementById("totalFechamentoFluxoSaidas").innerText = `R$ ${formatarMoeda(totalS)}`;

    const saldo = totalE - totalS;
    const elSaldo = document.getElementById("saldoFinalFluxo");
    if (elSaldo) {
        elSaldo.innerText = `R$ ${formatarMoeda(saldo)}`;
        elSaldo.style.color = saldo >= 0 ? '#3b82f6' : '#ef4444';
    }
}

function ordenarAnaliticoFluxo(tipo, campo) {
    sortDirecaoFluxo[tipo] = sortDirecaoFluxo[tipo] === 'asc' ? 'desc' : 'asc';
    dadosAnaliticoFluxo[tipo].sort((a, b) => {
        const valA = a[campo];
        const valB = b[campo];
        if (sortDirecaoFluxo[tipo] === 'asc') return valA > valB ? 1 : -1;
        return valA < valB ? 1 : -1;
    });
    renderizarAnaliticoFluxo(dadosAnaliticoFluxo.entradas, dadosAnaliticoFluxo.saidas);
}

function renderizarAnaliticoFluxo(entradas, saidas) {
    const tbodyE = document.getElementById("tabelaFluxoAnaliticoEntradas");
    const tbodyS = document.getElementById("tabelaFluxoAnaliticoSaidas");
    if (!tbodyE || !tbodyS) return;

    tbodyE.innerHTML = "";
    tbodyS.innerHTML = "";

    entradas.forEach(e => {
        const tr = document.createElement("tr");
        tr.style.borderBottom = "1px solid #f1f5f9";
        const dataObj = e.data ? new Date(e.data) : null;
        const dataStr = dataObj ? dataObj.toLocaleString("pt-BR", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
        tr.innerHTML = `
            <td style="padding: 10px;">${dataStr}</td>
            <td style="padding: 10px; font-weight: 500;">${e.nome}</td>
            <td style="padding: 10px;">${e.servico}</td>
            <td style="padding: 10px; text-align: right; font-weight: 700; color: #10b981;">R$ ${formatarMoeda(e.valor)}</td>
        `;
        tbodyE.appendChild(tr);
    });

    saidas.forEach(s => {
        const tr = document.createElement("tr");
        tr.style.borderBottom = "1px solid #f1f5f9";
        const dataObj = s.data ? new Date(s.data) : null;
        const dataStr = dataObj ? dataObj.toLocaleString("pt-BR", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
        tr.innerHTML = `
            <td style="padding: 10px;">${dataStr}</td>
            <td style="padding: 10px; font-weight: 500;">${s.nome}</td>
            <td style="padding: 10px;">${s.servico}</td>
            <td style="padding: 10px; text-align: right; font-weight: 700; color: #ef4444;">R$ ${formatarMoeda(s.valor)}</td>
        `;
        tbodyS.appendChild(tr);
    });
}

function alternarParaRelatorios() {
    document.getElementById("sectionComandas").classList.add("hidden");
    document.getElementById("sectionProdutos").classList.add("hidden");
    document.getElementById("sectionColaboradores").classList.add("hidden");
    document.getElementById("sectionFinanceiro").classList.add("hidden");
    if (document.getElementById("sectionFluxoCaixa")) document.getElementById("sectionFluxoCaixa").classList.add("hidden");
    if (document.getElementById("sectionFechamento")) document.getElementById("sectionFechamento").classList.add("hidden");
    sectionRelatorios.classList.remove("hidden");

    document.getElementById("navDashboard").classList.remove("active");
    document.getElementById("navProdutosSessao").classList.remove("active");
    document.getElementById("navColaboradores").classList.remove("active");
    document.getElementById("navFinanceiro").classList.remove("active");
    const navFC = document.getElementById("navFluxoCaixa");
    if (navFC) navFC.classList.remove("active");
    if (document.getElementById("navFechamento")) document.getElementById("navFechamento").classList.remove("active");
    navRelatorios.classList.add("active");

    configurarDatasPadraoRel();
    carregarRelatorioVendas();
}

function alternarParaFluxoCaixa() {
    document.getElementById("sectionComandas").classList.add("hidden");
    document.getElementById("sectionProdutos").classList.add("hidden");
    document.getElementById("sectionColaboradores").classList.add("hidden");
    document.getElementById("sectionFinanceiro").classList.add("hidden");
    document.getElementById("sectionRelatorios").classList.add("hidden");
    if (document.getElementById("sectionFechamento")) document.getElementById("sectionFechamento").classList.add("hidden");

    const secFluxo = document.getElementById("sectionFluxoCaixa");
    if (secFluxo) secFluxo.classList.remove("hidden");

    document.getElementById("navDashboard").classList.remove("active");
    document.getElementById("navProdutosSessao").classList.remove("active");
    document.getElementById("navColaboradores").classList.remove("active");
    document.getElementById("navFinanceiro").classList.remove("active");
    document.getElementById("navRelatorios").classList.remove("active");
    if (document.getElementById("navFechamento")) document.getElementById("navFechamento").classList.remove("active");

    const navFluxo = document.getElementById("navFluxoCaixa");
    if (navFluxo) navFluxo.classList.add("active");

    configurarDatasPadraoFluxo();
    carregarRelatorioFluxo();
}

function configurarDatasPadraoRel() {
    // Usar data local para evitar problema de fuso horário
    const agora = new Date();
    const hoje = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`;
    const elInicio = document.getElementById("relVendasInicio");
    const elFim = document.getElementById("relVendasFim");
    if (elInicio && !elInicio.value) elInicio.value = hoje;
    if (elFim && !elFim.value) elFim.value = hoje;
}

function configurarDatasPadraoFluxo() {
    // Usar data local para evitar problema de fuso horário
    const agora = new Date();
    const hoje = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`;
    const elInicio = document.getElementById("relFluxoInicio");
    const elFim = document.getElementById("relFluxoFim");
    if (elInicio && !elInicio.value) elInicio.value = hoje;
    if (elFim && !elFim.value) elFim.value = hoje;
}

// Listeners
if (navRelatorios) navRelatorios.onclick = (e) => { e.preventDefault(); alternarParaRelatorios(); };
const navFluxoBtn = document.getElementById("navFluxoCaixa");
if (navFluxoBtn) navFluxoBtn.onclick = (e) => { e.preventDefault(); alternarParaFluxoCaixa(); };

const inputBuscaVendas = document.getElementById("relVendasBusca");
if (inputBuscaVendas) {
    inputBuscaVendas.onkeydown = (e) => {
        if (e.key === 'Enter') carregarRelatorioVendas();
    };
}

// Expose global
window.carregarRelatorioVendas = carregarRelatorioVendas;
window.carregarRelatorioFluxo = carregarRelatorioFluxo;
window.alternarParaRelatorios = alternarParaRelatorios;
window.alternarParaFluxoCaixa = alternarParaFluxoCaixa;
window.alternarSubAbaFluxo = alternarSubAbaFluxo;
window.alternarSubAbaVendas = alternarSubAbaVendas;
window.ordenarGeralVendas = ordenarGeralVendas;
window.ordenarAnaliticoVendas = ordenarAnaliticoVendas;
window.ordenarComandasVendas = ordenarComandasVendas;
window.ordenarAnaliticoFluxo = ordenarAnaliticoFluxo;
