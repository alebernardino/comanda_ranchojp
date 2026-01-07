// ===============================
// FUNÇÕES PÚBLICAS
// ===============================

async function imprimirResumoPagamento() {
    try {
        const res = await fetch(`${API_URL}/comandas/${currentComandaNumero}/pagamentos`);
        const pagamentos = await res.json();

        let total = 0;
        const pagamentosFormatados = pagamentos.map(p => {
            total += p.valor;
            return { forma: p.forma, valor: p.valor };
        });

        // Se QZ Tray está ativo, usa impressão silenciosa
        if (typeof isQzTrayAtivo === "function" && isQzTrayAtivo()) {
            await imprimirResumoPag(currentComandaNumero, pagamentosFormatados, total);
            return;
        }

        // Fallback: impressão via navegador
        const elemento = document.getElementById("printResumoPagamento");
        if (!elemento) return;

        const body = document.getElementById("printResumoPagamentoBody");
        const info = document.getElementById("printResumoInfo");
        const totalEl = document.getElementById("printResumoTotal");

        if (!body || !info || !totalEl) return;

        body.innerHTML = "";

        const agora = new Date();
        const nome = document.getElementById("nomeComanda")?.value || "";
        info.innerHTML = `<strong>COMANDA: ${currentComandaNumero}</strong><br>DATA: ${agora.toLocaleDateString()} ${agora.toLocaleTimeString()}` + (nome ? `<br>CLIENTE: ${nome}` : "");

        pagamentos.forEach(p => {
            const tr = document.createElement("tr");
            tr.innerHTML = `<td style="padding: 1mm 0; text-align: left;">${p.forma}</td><td style="text-align: right; padding: 1mm 0;">R$ ${formatarMoeda(p.valor)}</td>`;
            body.appendChild(tr);
        });

        totalEl.innerText = `TOTAL PAGO: R$ ${formatarMoeda(total)}`;

        // Função para limpar após impressão
        const limparAposImpressao = () => {
            document.body.classList.remove("printing-receipt");
            window.removeEventListener('afterprint', limparAposImpressao);
        };

        // Adicionar listener para limpar após impressão
        window.addEventListener('afterprint', limparAposImpressao);

        document.body.classList.add("printing-receipt");
        window.print();

    } catch (err) {
        console.error("Erro ao imprimir resumo:", err);
    }
}

async function imprimirComandaAcao() {
    // Se QZ Tray está ativo, usa impressão silenciosa
    if (typeof isQzTrayAtivo === "function" && isQzTrayAtivo()) {
        const itens = [];
        let totalVal = 0;

        const linhas = tabelaItensBody.querySelectorAll("tr");
        linhas.forEach(tr => {
            const tds = tr.querySelectorAll("td");
            if (tds.length >= 5) {
                const codigo = tds[0].innerText.trim();
                const descricao = tds[1].innerText.trim();
                const quantidade = parseFloat(tds[2].querySelector(".qtd-item")?.innerText || tds[2].innerText) || 0;
                const valor = parseMoeda(tds[3].innerText);
                const subtotal = parseMoeda(tds[4].innerText);
                itens.push({ codigo, descricao, quantidade, valor, subtotal });
                totalVal += subtotal;
            }
        });

        const nome = nomeComanda ? nomeComanda.value : "";
        const tel = telefoneComanda ? telefoneComanda.value : "";

        await imprimirComanda(currentComandaNumero, nome, tel, itens, totalVal);
        return;
    }

    // Fallback: impressão via navegador
    // Função para limpar após impressão
    const limparAposImpressao = () => {
        document.body.classList.remove("printing-comanda");
        window.removeEventListener('afterprint', limparAposImpressao);
    };

    // Adicionar listener para limpar após impressão
    window.addEventListener('afterprint', limparAposImpressao);

    document.body.classList.add("printing-comanda");
    window.print();
}

async function imprimirDivisaoAcao(itensParaImprimir = null, totalParaImprimir = 0) {
    // Se o primeiro argumento for um evento (clique do botão) ou não for um array, tratamos como nulo
    if (itensParaImprimir instanceof Event || !Array.isArray(itensParaImprimir)) {
        itensParaImprimir = null;
    }

    // Se não foram passados itens, coletar da tabela atual (impressão manual via F9 ou clique)
    if (!itensParaImprimir || itensParaImprimir.length === 0) {

        itensParaImprimir = [];
        totalParaImprimir = 0;
        itensAgrupadosDivisao.forEach(item => {
            const sel = item.selecionado || 0;
            if (sel > 0) {
                const subtotal = sel * item.valor;
                itensParaImprimir.push({
                    codigo: item.codigo,
                    descricao: item.descricao,
                    quantidade: sel,
                    valor: item.valor,
                    subtotal: subtotal
                });
                totalParaImprimir += subtotal;
            }
        });
    }

    // Se QZ Tray está ativo, usa impressão silenciosa
    if (typeof isQzTrayAtivo === "function" && isQzTrayAtivo()) {
        await imprimirItensParciais(currentComandaNumero, itensParaImprimir, totalParaImprimir);
        return;
    }

    // Fallback: impressão via navegador
    const printContainer = document.getElementById("printItensParciais");
    const printTitulo = document.getElementById("printParciaisTitulo");
    const printBody = document.getElementById("printParciaisBody");
    const printTotal = document.getElementById("printParciaisTotal");

    if (!printContainer || !printBody) {
        window.print();
        return;
    }

    // Preencher o template
    if (printTitulo) printTitulo.innerText = `Comanda ${currentComandaNumero}`;

    printBody.innerHTML = "";
    itensParaImprimir.forEach(item => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
      <td style="padding: 1mm 0;">${item.descricao}</td>
      <td style="text-align: center;">${item.quantidade}</td>
      <td style="text-align: right;">R$ ${formatarMoeda(item.subtotal)}</td>
    `;
        printBody.appendChild(tr);
    });

    if (printTotal) printTotal.innerText = `TOTAL: R$ ${formatarMoeda(totalParaImprimir)}`;

    // Mostrar o container e imprimir
    printContainer.classList.add("active");
    document.body.classList.add("printing-parcial");

    // Função para limpar após impressão
    const limparAposImpressao = () => {
        printContainer.classList.remove("active");
        document.body.classList.remove("printing-parcial");

        // Limpar completamente o conteúdo do template para evitar impressões duplicadas
        if (printTitulo) printTitulo.innerText = "";
        if (printBody) printBody.innerHTML = "";
        if (printTotal) printTotal.innerText = "";

        window.removeEventListener('afterprint', limparAposImpressao);
    };

    // Adicionar listener para limpar após impressão
    window.addEventListener('afterprint', limparAposImpressao);

    // Fallback com timeout caso o evento não dispare
    setTimeout(() => {
        window.print();
    }, 100);
}

// ===============================
// EXPOSIÇÃO GLOBAL DAS FUNÇÕES
// ===============================
window.imprimirResumoPagamento = imprimirResumoPagamento;
window.imprimirComandaAcao = imprimirComandaAcao;
window.imprimirDivisaoAcao = imprimirDivisaoAcao;

