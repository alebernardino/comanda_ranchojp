// ===============================
// FUNÇÕES PÚBLICAS
// ===============================

async function imprimirResumoPagamento() {
    try {
        const pagamentos = await getPagamentosComanda(currentComandaNumero);

        let total = 0;
        const pagamentosFormatados = pagamentos.map(p => {
            total += p.valor;
            return { forma: p.forma, valor: p.valor };
        });

        // Sempre tenta o fluxo central de impressão primeiro (serial/QZ/backend).
        if (typeof imprimirResumoPag === "function") {
            const ok = await imprimirResumoPag(currentComandaNumero, pagamentosFormatados, total);
            if (ok) return;
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
    const itens = [];
    let totalVal = 0;

    const linhas = tabelaItensBody.querySelectorAll("tr");
    linhas.forEach(tr => {
        const tds = tr.querySelectorAll("td");
<<<<<<< HEAD
        if (tds.length >= 7) {
            const codigo = tds[0].innerText.trim();
            const descricao = tds[1].innerText.trim();
            const quantidade = parseFloat(tds[2].querySelector(".qtd-item")?.innerText || tds[2].innerText) || 0;
            const valor = parseMoeda(tds[5].innerText);
            const subtotal = parseMoeda(tds[6].innerText);
=======
        if (tds.length >= 5) {
            const codigo = tds[0].innerText.trim();
            const descricao = tds[1].innerText.trim();
            const quantidade = parseFloat(tds[2].querySelector(".qtd-item")?.innerText || tds[2].innerText) || 0;
            const valor = parseMoeda(tds[3].innerText);
            const subtotal = parseMoeda(tds[4].innerText);
>>>>>>> 9099b41094357b03608056559d9d191b58d7a433
            itens.push({ codigo, descricao, quantidade, valor, subtotal });
            totalVal += subtotal;
        }
    });

    const nome = nomeComanda ? nomeComanda.value : "";
    const tel = telefoneComanda ? telefoneComanda.value : "";

    if (typeof imprimirComanda === "function") {
        const ok = await imprimirComanda(currentComandaNumero, nome, tel, itens, totalVal);
        if (ok) return;
    }

    // Fallback: ainda imprime o cupom correto (não a tela/modal)
    try {
        if (typeof gerarHTMLComanda === "function" && typeof imprimirViaBrowser === "function") {
            const html = gerarHTMLComanda(currentComandaNumero, nome, tel, itens, totalVal);
            imprimirViaBrowser(html, `Comanda ${currentComandaNumero}`);
            return;
        }
    } catch (err) {
        console.error("Erro no fallback do cupom:", err);
    }

    // Último fallback absoluto
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

    console.log("Imprimindo divisão:", { itensParaImprimir, totalParaImprimir });

    // Validação: se não há itens, não imprimir
    if (!itensParaImprimir || itensParaImprimir.length === 0) {
        alert("Nenhum item selecionado para impressão");
        return;
    }

    // Sempre tenta o fluxo central de impressão primeiro (serial/QZ/backend).
    if (typeof imprimirItensParciais === "function") {
        const ok = await imprimirItensParciais(currentComandaNumero, itensParaImprimir, totalParaImprimir);
        if (ok) return;
    }

    // Fallback: impressão via navegador
    const printContainer = document.getElementById("printItensParciais");
    const printTitulo = document.getElementById("printParciaisTitulo");
    const printBody = document.getElementById("printParciaisBody");
    const printTotal = document.getElementById("printParciaisTotal");

    if (!printContainer || !printBody) {
        console.error("Template de impressão não encontrado");
        window.print();
        return;
    }

    // Preencher o template
    if (printTitulo) printTitulo.innerText = `Comanda ${currentComandaNumero}`;

    printBody.innerHTML = "";
    itensParaImprimir.forEach(item => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
      <td style="padding: 1mm 2mm; border-bottom: 0.5pt dashed #ccc;">${item.descricao}</td>
      <td style="padding: 1mm 2mm; text-align: center; border-bottom: 0.5pt dashed #ccc;">${item.quantidade}</td>
      <td style="padding: 1mm 2mm; text-align: right; border-bottom: 0.5pt dashed #ccc;">R$ ${formatarMoeda(item.subtotal)}</td>
    `;
        printBody.appendChild(tr);
    });

    if (printTotal) printTotal.innerText = `TOTAL: R$ ${formatarMoeda(totalParaImprimir)}`;

    console.log("Template preenchido:", {
        titulo: printTitulo?.innerText,
        linhas: printBody.children.length,
        total: printTotal?.innerText
    });

    // Mostrar o container e imprimir
    printContainer.style.display = "block";
    document.body.classList.add("printing-parcial");

    // Função para limpar após impressão
    const limparAposImpressao = () => {
        printContainer.style.display = "none";
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
