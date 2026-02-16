// ===============================
// MÓDULO DE IMPRESSÃO COM QZ TRAY
// ===============================

// Configuração da impressora
const PRINTER_CONFIG = {
  // Nome da impressora térmica (será detectado automaticamente ou pode ser configurado)
  printerName: null, // null = usa a impressora padrão
  // Largura do papel em mm
  paperWidth: 80,
  // Encoding para caracteres especiais (português)
  encoding: "UTF-8"
};

// Estado da conexão
let qzConnected = false;
let qzAvailable = false;
let backendPrinterConfig = null;

// ===============================
// INICIALIZAÇÃO DO QZ TRAY
// ===============================

async function initQzTray() {
  // Verifica se QZ Tray está disponível
  if (typeof qz === "undefined") {
    console.warn("QZ Tray não está carregado. Usando impressão padrão do navegador.");
    qzAvailable = false;
    return false;
  }

  qzAvailable = true;

  try {
    // Configura certificado de segurança (para produção, use um certificado válido)
    qz.security.setCertificatePromise(function (resolve, reject) {
      // Para desenvolvimento, aceita qualquer certificado
      // Em produção, configure com seu certificado
      resolve();
    });

    qz.security.setSignaturePromise(function (toSign) {
      return function (resolve, reject) {
        // Para desenvolvimento, retorna assinatura vazia
        // Em produção, assine com sua chave privada
        resolve();
      };
    });

    // Tenta conectar ao QZ Tray
    if (!qz.websocket.isActive()) {
      await qz.websocket.connect();
      console.log("✅ Conectado ao QZ Tray");
    }

    qzConnected = true;

    // Detecta impressoras disponíveis
    const printers = await qz.printers.find();
    console.log("Impressoras disponíveis:", printers);

    // Tenta encontrar uma impressora térmica
    const thermalPrinter = printers.find(p =>
      p.toLowerCase().includes("thermal") ||
      p.toLowerCase().includes("pos") ||
      p.toLowerCase().includes("epson") ||
      p.toLowerCase().includes("elgin") ||
      p.toLowerCase().includes("bematech") ||
      p.toLowerCase().includes("daruma") ||
      p.toLowerCase().includes("generic")
    );

    if (thermalPrinter) {
      PRINTER_CONFIG.printerName = thermalPrinter;
      console.log("📠 Impressora térmica detectada:", thermalPrinter);
    } else if (printers.length > 0) {
      PRINTER_CONFIG.printerName = printers[0];
      console.log("📠 Usando primeira impressora:", printers[0]);
    }

    return true;
  } catch (err) {
    console.error("Erro ao conectar ao QZ Tray:", err);
    qzConnected = false;
    return false;
  }
}

async function loadBackendPrinterConfig() {
  if (typeof getPrinterConfig !== "function") return null;
  try {
    backendPrinterConfig = await getPrinterConfig();
    return backendPrinterConfig;
  } catch (err) {
    console.warn("Não foi possível carregar config de impressora:", err);
    backendPrinterConfig = null;
    return null;
  }
}

function getBackendPrinterMode() {
  return backendPrinterConfig?.mode || null;
}

function shouldUseBackendPrinter() {
  const mode = getBackendPrinterMode();
  return mode === "serial" || mode === "simulado";
}

// ===============================
// FUNÇÃO PRINCIPAL DE IMPRESSÃO
// ===============================

async function imprimirSilencioso(conteudoHTML, titulo = "Impressão", conteudoTexto = null, backendDoc = null) {
  if (!backendPrinterConfig) {
    await loadBackendPrinterConfig();
  }

  if (shouldUseBackendPrinter()) {
    if (backendDoc) {
      return await imprimirViaBackendDocumento(backendDoc, titulo);
    }
    if (conteudoTexto) {
      return await imprimirViaBackend(conteudoTexto, titulo);
    }
  }

  // Se QZ Tray está conectado, usa impressão silenciosa
  if (qzConnected && qzAvailable) {
    return await imprimirViaQZ(conteudoHTML, titulo);
  }

  // Fallback: tenta conectar ao QZ Tray
  if (qzAvailable && !qzConnected) {
    const conectou = await initQzTray();
    if (conectou) {
      return await imprimirViaQZ(conteudoHTML, titulo);
    }
  }

  // Fallback final: usa window.print()
  console.warn("QZ Tray não disponível. Usando impressão padrão.");
  return imprimirViaBrowser(conteudoHTML, titulo);
}

async function imprimirViaQZ(conteudoHTML, titulo) {
  try {
    const config = qz.configs.create(PRINTER_CONFIG.printerName, {
      margins: { top: 0, right: 0, bottom: 0, left: 0 },
      units: "mm",
      size: { width: PRINTER_CONFIG.paperWidth, height: null }, // altura automática
      colorType: "grayscale",
      interpolation: "nearest-neighbor"
    });

    // Converte HTML para dados de impressão
    const data = [{
      type: "html",
      format: "plain",
      data: conteudoHTML,
      options: {
        pageWidth: PRINTER_CONFIG.paperWidth,
        encoding: PRINTER_CONFIG.encoding
      }
    }];

    await qz.print(config, data);
    console.log("✅ Impressão enviada com sucesso:", titulo);
    return true;
  } catch (err) {
    console.error("Erro na impressão QZ:", err);
    // Fallback para impressão do navegador
    return imprimirViaBrowser(conteudoHTML, titulo);
  }
}

function imprimirViaBrowser(conteudoHTML, titulo = "Impressao") {
  if (!conteudoHTML || typeof conteudoHTML !== "string") {
    window.print();
    return true;
  }

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.setAttribute("aria-hidden", "true");
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc || !iframe.contentWindow) {
    document.body.removeChild(iframe);
    window.print();
    return true;
  }

  doc.open();
  doc.write(conteudoHTML);
  doc.title = titulo;
  doc.close();

  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    }, 1200);
  }, 180);
  return true;
}

async function imprimirViaBackend(texto, titulo) {
  if (typeof printRawText !== "function") return false;
  try {
    await printRawText({ text: texto, cut: true, title: titulo });
    console.log("✅ Impressão serial enviada:", titulo);
    return true;
  } catch (err) {
    console.error("Erro na impressão serial:", err);
    alert("Impressora não conectada ou porta indisponível.");
    return false;
  }
}

async function imprimirViaBackendDocumento(doc, titulo) {
  if (typeof printDocument !== "function") return false;
  try {
    await printDocument(doc);
    console.log("✅ Impressão serial enviada (documento):", titulo);
    return true;
  } catch (err) {
    console.error("Erro na impressão serial (documento):", err);
    alert("Impressora não conectada ou porta indisponível.");
    return false;
  }
}

// ===============================
// FUNÇÕES DE IMPRESSÃO ESPECÍFICAS
// ===============================

async function imprimirComanda(comandaNumero, nomeCliente, telefone, itens, total) {
  const html = gerarHTMLComanda(comandaNumero, nomeCliente, telefone, itens, total);
  const texto = gerarTextoComanda(comandaNumero, nomeCliente, telefone, itens, total);
  const doc = {
    kind: "comanda",
    data: { comandaNumero, nomeCliente, telefone, itens, total },
    cut: true
  };
  return await imprimirSilencioso(html, `Comanda ${comandaNumero}`, texto, doc);
}

async function imprimirItensParciais(comandaNumero, itens, total) {
  const html = gerarHTMLItensParciais(comandaNumero, itens, total);
  const texto = gerarTextoItensParciais(comandaNumero, itens, total);
  const doc = {
    kind: "parcial",
    data: { comandaNumero, itens, total },
    cut: true
  };
  return await imprimirSilencioso(html, `Parcial Comanda ${comandaNumero}`, texto, doc);
}

async function imprimirResumoPag(comandaNumero, pagamentos, total) {
  const html = gerarHTMLResumoPagamento(comandaNumero, pagamentos, total);
  const texto = gerarTextoResumoPagamento(comandaNumero, pagamentos, total);
  const doc = {
    kind: "pagamento",
    data: { comandaNumero, pagamentos, total },
    cut: true
  };
  return await imprimirSilencioso(html, `Pagamento Comanda ${comandaNumero}`, texto, doc);
}

async function imprimirFechamento(data, vendas, pagamentos, recebimentosSistema, recebimentosManuais) {
  const html = gerarHTMLFechamento(data, vendas, pagamentos, recebimentosSistema, recebimentosManuais);
  const texto = gerarTextoFechamento(data, vendas, pagamentos, recebimentosSistema, recebimentosManuais);
  const doc = {
    kind: "fechamento",
    data: { data, vendas, pagamentos, recebimentosSistema, recebimentosManuais },
    cut: true
  };
  return await imprimirSilencioso(html, `Fechamento ${data}`, texto, doc);
}

// ===============================
// GERADORES DE HTML PARA IMPRESSÃO
// ===============================

function gerarCabecalhoHTML() {
  return `
    <div class="print-header">
      <h1>RESTAURANTE RANCHO JP</h1>
    </div>
  `;
}

function gerarRodapeHTML() {
  return `
    <div class="print-footer">
      <span>📸 @restauranteranchojp</span> | <span>📱 (16) 991211765</span>
    </div>
    <div class="print-spacer"></div>
  `;
}

function gerarHTMLComanda(comandaNumero, nomeCliente, telefone, itens, total) {
  let itensHTML = "";
  itens.forEach(item => {
    const qtd = Number(item.quantidade || 0);
    const valorUnitario = Number(item.valor || 0);
    const valorTotalItem = Number(item.subtotal || (qtd * valorUnitario));
    itensHTML += `
      <tr>
        <td>${item.descricao}</td>
        <td class="text-center">${qtd}</td>
        <td class="text-right">R$ ${formatarMoeda(valorUnitario)}</td>
        <td class="text-right">R$ ${formatarMoeda(valorTotalItem)}</td>
      </tr>
    `;
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <link rel="stylesheet" href="../css/base/print.css">
      <style>
        body { font-family: 'Courier New', monospace; font-size: 9pt; width: 76mm; margin: 0; padding: 2mm; }
        table { width: 100%; border-collapse: collapse; }
        th { border-bottom: 1px solid black; padding: 1mm 0; text-align: left; font-size: 8pt; }
        td { padding: 1mm 0; border-bottom: 0.5px dashed #ccc; }
      </style>
    </head>
    <body>
      ${gerarCabecalhoHTML()}
      <h2 class="print-comanda-title">COMANDA ${comandaNumero}</h2>
      <div class="print-comanda-info">
        ${nomeCliente ? `<div>Cliente: <strong>${nomeCliente}</strong></div>` : ""}
        ${telefone ? `<div>Tel: ${telefone}</div>` : ""}
        <div>Data: ${new Date().toLocaleString("pt-BR")}</div>
      </div>
      <table class="print-table">
        <thead>
          <tr>
            <th>Descrição</th>
            <th class="text-center">Qtd</th>
            <th class="text-right">Valor</th>
            <th class="text-right">Sub Total</th>
          </tr>
        </thead>
        <tbody>
          ${itensHTML}
        </tbody>
      </table>
      <div class="print-total">
        <strong>TOTAL: R$ ${formatarMoeda(total)}</strong>
      </div>
      ${gerarRodapeHTML()}
    </body>
    </html>
  `;
}

function gerarHTMLItensParciais(comandaNumero, itens, total) {
  let itensHTML = "";
  itens.forEach(item => {
    const qtd = Number(item.quantidade || 0);
    const valorUnitario = Number(item.valor || 0);
    const valorTotalItem = Number(item.subtotal || (qtd * valorUnitario));
    itensHTML += `
      <tr>
        <td class="print-table">${item.descricao}</td>
        <td class="text-center">${qtd}</td>
        <td class="text-right">R$ ${formatarMoeda(valorUnitario)}</td>
        <td class="text-right">R$ ${formatarMoeda(valorTotalItem)}</td>
      </tr>
    `;
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <link rel="stylesheet" href="../css/base/print.css">
      <style>
        body { font-family: 'Courier New', monospace; font-size: 9pt; width: 76mm; margin: 0; padding: 2mm; }
        table { width: 100%; border-collapse: collapse; }
        th { border-bottom: 1px solid black; padding: 1mm 0; text-align: left; font-size: 8pt; }
        td { padding: 1mm 0; border-bottom: 0.5px dashed #ccc; }
      </style>
    </head>
    <body>
      ${gerarCabecalhoHTML()}
      <h2 class="print-comanda-title">COMANDA ${comandaNumero}</h2>
      <table class="print-table">
        <thead>
          <tr>
            <th>Descrição</th>
            <th class="text-center">Qtd</th>
            <th class="text-right">Valor</th>
            <th class="text-right">Sub Total</th>
          </tr>
        </thead>
        <tbody>
          ${itensHTML}
        </tbody>
      </table>
      <div class="print-total">
        <strong>TOTAL: R$ ${formatarMoeda(total)}</strong>
      </div>
      ${gerarRodapeHTML()}
    </body>
    </html>
  `;
}

function gerarHTMLResumoPagamento(comandaNumero, pagamentos, total) {
  let pagamentosHTML = "";
  pagamentos.forEach(pag => {
    pagamentosHTML += `
      <tr>
        <td class="print-table">${pag.forma}</td>
        <td class="text-right">R$ ${formatarMoeda(pag.valor)}</td>
      </tr>
    `;
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <link rel="stylesheet" href="../css/base/print.css">
      <style>
        body { font-family: 'Courier New', monospace; font-size: 9pt; width: 76mm; margin: 0; padding: 2mm; }
        table { width: 100%; border-collapse: collapse; }
        th { border-bottom: 1px solid black; padding: 1mm 0; text-align: left; font-size: 8pt; }
        td { padding: 1mm 0; }
      </style>
    </head>
    <body>
      ${gerarCabecalhoHTML()}
      <h3 class="print-payment-title">RESUMO DE PAGAMENTO</h3>
      <div class="print-payment-info">
        Comanda: ${comandaNumero}<br>
        Data: ${new Date().toLocaleString("pt-BR")}
      </div>
      <table class="print-table">
        <thead>
          <tr>
            <th>FORMA</th>
            <th class="text-right">VALOR</th>
          </tr>
        </thead>
        <tbody>
          ${pagamentosHTML}
        </tbody>
      </table>
      <div class="print-total">
        <strong>TOTAL: R$ ${formatarMoeda(total)}</strong>
      </div>
      ${gerarRodapeHTML()}
    </body>
    </html>
  `;
}

function gerarHTMLFechamento(data, vendas, pagamentos, recebimentosSistema, recebimentosManuais) {
  const vendasOrdenadas = [...(vendas || [])].sort((a, b) => {
    const qtdA = Number(a.quantidade) || 0;
    const qtdB = Number(b.quantidade) || 0;
    if (qtdA !== qtdB) return qtdB - qtdA;
    return String(a.descricao || "").localeCompare(String(b.descricao || ""), "pt-BR");
  });
  let vendasHTML = "";
  vendasOrdenadas.forEach(v => {
    vendasHTML += `<tr><td class="print-table">${v.descricao}</td><td class="text-right">${v.quantidade}</td></tr>`;
  });

  let pagamentosHTML = "";
  pagamentos.forEach(p => {
    pagamentosHTML += `<tr><td class="print-table">${p.fornecedor}</td><td class="text-right">R$ ${formatarMoeda(p.total)}</td></tr>`;
  });

  let sistemaHTML = "";
  let sistemaTotal = 0;
  recebimentosSistema.forEach(r => {
    sistemaTotal += Number(r.total || 0);
    sistemaHTML += `<tr><td class="print-table">${r.forma}</td><td class="text-right">R$ ${formatarMoeda(r.total)}</td></tr>`;
  });
  if (recebimentosSistema.length > 0) {
    sistemaHTML += `<tr><td class="print-table"><strong>TOTAL</strong></td><td class="text-right"><strong>R$ ${formatarMoeda(sistemaTotal)}</strong></td></tr>`;
  }

  let manualHTML = "";
  recebimentosManuais.forEach(m => {
    if (m.valor > 0) {
      manualHTML += `<tr><td class="print-table">${m.forma}</td><td class="text-right">R$ ${formatarMoeda(m.valor)}</td></tr>`;
    }
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <link rel="stylesheet" href="../css/base/print.css">
      <style>
        body { font-family: 'Courier New', monospace; font-size: 9pt; width: 76mm; margin: 0; padding: 2mm; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 3mm; }
        th { border-bottom: 1px solid black; padding: 1mm 0; text-align: left; font-size: 8pt; }
        td { padding: 1mm 0; }
        h3 { font-size: 10pt; border-bottom: 1px dashed black; margin-top: 3mm; margin-bottom: 2mm; }
      </style>
    </head>
    <body>
      ${gerarCabecalhoHTML()}
      <h2 class="print-closing-title">FECHAMENTO DIÁRIO</h2>
      <p class="print-closing-info">
        DATA: ${data}
      </p>

      ${pagamentos.length > 0 ? `
        <h3>PAGAMENTOS (SAÍDAS)</h3>
        <table class="print-table">
          <thead><tr><th>RECEBEDOR</th><th class="text-right">VALOR</th></tr></thead>
          <tbody>${pagamentosHTML}</tbody>
        </table>
      ` : ""}

      ${recebimentosSistema.length > 0 ? `
        <h3>RECEBIMENTOS (SISTEMA)</h3>
        <table class="print-table">
          <thead><tr><th>MÉTODO</th><th class="text-right">VALOR</th></tr></thead>
          <tbody>${sistemaHTML}</tbody>
        </table>
      ` : ""}

      ${manualHTML ? `
        <h3>RECEBIMENTOS (MANUAL)</h3>
        <table class="print-table">
          <thead><tr><th>FORMA</th><th class="text-right">VALOR</th></tr></thead>
          <tbody>${manualHTML}</tbody>
        </table>
      ` : ""}

      ${vendasOrdenadas.length > 0 ? `
        <h3>VENDAS POR ITEM</h3>
        <table class="print-table">
          <thead><tr><th>ITEM</th><th class="text-right">QTD</th></tr></thead>
          <tbody>${vendasHTML}</tbody>
        </table>
      ` : ""}

      ${gerarRodapeHTML()}
    </body>
    </html>
  `;
}

// ===============================
// GERADORES DE TEXTO (ESC/POS)
// ===============================

function getTextColumns() {
  const paperWidth = backendPrinterConfig?.paperWidth || PRINTER_CONFIG.paperWidth || 80;
  return paperWidth <= 58 ? 32 : 48;
}

function padRight(text, width) {
  const t = text.length > width ? text.slice(0, width) : text;
  return t + " ".repeat(Math.max(0, width - t.length));
}

function padLeft(text, width) {
  const t = text.length > width ? text.slice(0, width) : text;
  return " ".repeat(Math.max(0, width - t.length)) + t;
}

function centerText(text, width) {
  const t = text.length > width ? text.slice(0, width) : text;
  const left = Math.floor((width - t.length) / 2);
  const right = width - t.length - left;
  return " ".repeat(left) + t + " ".repeat(right);
}

function linhaSeparadora(width, char = "-") {
  return char.repeat(width);
}

function gerarTextoComanda(comandaNumero, nomeCliente, telefone, itens, total) {
  const cols = getTextColumns();
  const linhas = [];
  linhas.push(centerText("RESTAURANTE RANCHO JP", cols));
  linhas.push(centerText(`COMANDA ${comandaNumero}`, cols));
  linhas.push(linhaSeparadora(cols));
  if (nomeCliente) linhas.push(`CLIENTE: ${nomeCliente}`);
  if (telefone) linhas.push(`TEL: ${telefone}`);
  linhas.push(`DATA: ${new Date().toLocaleString("pt-BR")}`);
  linhas.push(linhaSeparadora(cols));

  const colQtd = cols <= 32 ? 3 : 4;
  const colUnit = cols <= 32 ? 8 : 10;
  const colTotal = cols <= 32 ? 8 : 10;
  const colDesc = Math.max(8, cols - colQtd - colUnit - colTotal - 9);
  linhas.push(
    padRight("Descricao", colDesc) + " | " +
    padLeft("Qtd", colQtd) + " | " +
    padLeft("Valor", colUnit) + " | " +
    padLeft("Sub Total", colTotal)
  );
  linhas.push(linhaSeparadora(cols));

  itens.forEach(item => {
    const qtd = Number(item.quantidade || 0);
    const valorUnitario = Number(item.valor || 0);
    const valorTotalItem = Number(item.subtotal || (qtd * valorUnitario));
    const unit = `R$ ${formatarMoeda(valorUnitario)}`;
    const totalItem = `R$ ${formatarMoeda(valorTotalItem)}`;
    linhas.push(
      padRight(String(item.descricao || ""), colDesc) + " | " +
      padLeft(String(qtd), colQtd) + " | " +
      padLeft(unit, colUnit) + " | " +
      padLeft(totalItem, colTotal)
    );
  });

  linhas.push(linhaSeparadora(cols));
  linhas.push(padLeft(`TOTAL: R$ ${formatarMoeda(total)}`, cols));
  linhas.push(linhaSeparadora(cols));
  linhas.push(centerText("@restauranteranchojp", cols));
  linhas.push(centerText("(16) 991211765", cols));
  linhas.push("");
  return linhas.join("\n");
}

function gerarTextoItensParciais(comandaNumero, itens, total) {
  const cols = getTextColumns();
  const linhas = [];
  linhas.push(centerText("RESTAURANTE RANCHO JP", cols));
  linhas.push(centerText(`COMANDA ${comandaNumero}`, cols));
  linhas.push(linhaSeparadora(cols));

  const colQtd = cols <= 32 ? 3 : 4;
  const colValor = cols <= 32 ? 8 : 10;
  const colSubtotal = cols <= 32 ? 8 : 10;
  const colDesc = Math.max(8, cols - colQtd - colValor - colSubtotal - 9);
  linhas.push(
    padRight("Descricao", colDesc) + " | " +
    padLeft("Qtd", colQtd) + " | " +
    padLeft("Valor", colValor) + " | " +
    padLeft("Sub Total", colSubtotal)
  );
  linhas.push(linhaSeparadora(cols));

  itens.forEach(item => {
    const qtd = Number(item.quantidade || 0);
    const valorUnitario = Number(item.valor || 0);
    const subtotal = Number(item.subtotal || (qtd * valorUnitario));
    const valor = `R$ ${formatarMoeda(valorUnitario)}`;
    const subTotal = `R$ ${formatarMoeda(subtotal)}`;
    linhas.push(
      padRight(String(item.descricao || ""), colDesc) + " | " +
      padLeft(String(qtd), colQtd) + " | " +
      padLeft(valor, colValor) + " | " +
      padLeft(subTotal, colSubtotal)
    );
  });

  linhas.push(linhaSeparadora(cols));
  linhas.push(padLeft(`TOTAL: R$ ${formatarMoeda(total)}`, cols));
  linhas.push(linhaSeparadora(cols));
  linhas.push(centerText("@restauranteranchojp", cols));
  linhas.push(centerText("(16) 991211765", cols));
  linhas.push("");
  return linhas.join("\n");
}

function gerarTextoResumoPagamento(comandaNumero, pagamentos, total) {
  const cols = getTextColumns();
  const linhas = [];
  linhas.push(centerText("RESUMO DE PAGAMENTO", cols));
  linhas.push(`COMANDA: ${comandaNumero}`);
  linhas.push(`DATA: ${new Date().toLocaleString("pt-BR")}`);
  linhas.push(linhaSeparadora(cols));

  const colForma = cols - 12 - 1;
  pagamentos.forEach(pag => {
    const valor = `R$ ${formatarMoeda(pag.valor)}`;
    linhas.push(
      padRight(String(pag.forma || ""), colForma) + " " +
      padLeft(valor, 12)
    );
  });

  linhas.push(linhaSeparadora(cols));
  linhas.push(padLeft(`TOTAL: R$ ${formatarMoeda(total)}`, cols));
  linhas.push(linhaSeparadora(cols));
  linhas.push("");
  return linhas.join("\n");
}

function gerarTextoFechamento(data, vendas, pagamentos, recebimentosSistema, recebimentosManuais) {
  const cols = getTextColumns();
  const linhas = [];
  const vendasOrdenadas = [...(vendas || [])].sort((a, b) => {
    const qtdA = Number(a.quantidade) || 0;
    const qtdB = Number(b.quantidade) || 0;
    if (qtdA !== qtdB) return qtdB - qtdA;
    return String(a.descricao || "").localeCompare(String(b.descricao || ""), "pt-BR");
  });
  linhas.push(centerText("FECHAMENTO DIARIO", cols));
  linhas.push(`DATA: ${data}`);
  linhas.push(linhaSeparadora(cols));

  if (pagamentos.length > 0) {
    linhas.push("PAGAMENTOS (SAIDAS)");
    pagamentos.forEach(p => {
      const valor = `R$ ${formatarMoeda(p.total)}`;
      linhas.push(padRight(String(p.fornecedor || ""), cols - 12) + padLeft(valor, 12));
    });
    linhas.push(linhaSeparadora(cols));
  }

  if (recebimentosSistema.length > 0) {
    linhas.push("RECEBIMENTOS (SISTEMA)");
    let totalSistema = 0;
    recebimentosSistema.forEach(r => {
      totalSistema += Number(r.total || 0);
      const valor = `R$ ${formatarMoeda(r.total)}`;
      linhas.push(padRight(String(r.forma || ""), cols - 12) + padLeft(valor, 12));
    });
    linhas.push(padRight("TOTAL", cols - 12) + padLeft(`R$ ${formatarMoeda(totalSistema)}`, 12));
    linhas.push(linhaSeparadora(cols));
  }

  const manualFiltrado = recebimentosManuais.filter(m => m.valor > 0);
  if (manualFiltrado.length > 0) {
    linhas.push("RECEBIMENTOS (MANUAL)");
    manualFiltrado.forEach(m => {
      const valor = `R$ ${formatarMoeda(m.valor)}`;
      linhas.push(padRight(String(m.forma || ""), cols - 12) + padLeft(valor, 12));
    });
    linhas.push(linhaSeparadora(cols));
  }

  if (vendasOrdenadas.length > 0) {
    linhas.push("VENDAS POR ITEM");
    vendasOrdenadas.forEach(v => {
      linhas.push(padRight(String(v.descricao || ""), cols - 6) + padLeft(String(v.quantidade || ""), 6));
    });
    linhas.push(linhaSeparadora(cols));
  }

  linhas.push("");
  return linhas.join("\n");
}

// ===============================
// VERIFICAR STATUS DO QZ TRAY
// ===============================

function isQzTrayAtivo() {
  // Mantem compatibilidade com chamadas antigas: "ativo" agora inclui
  // impressao via backend (serial/simulado), alem do QZ Tray.
  return shouldUseBackendPrinter() || (qzConnected && qzAvailable);
}

function getStatusImpressora() {
  if (shouldUseBackendPrinter()) {
    return {
      status: "serial",
      impressora: backendPrinterConfig?.port || "Porta não configurada",
      metodo: backendPrinterConfig?.mode === "simulado" ? "Simulado (log)" : "Serial (ESC/POS)"
    };
  }
  if (qzConnected) {
    return {
      status: "conectado",
      impressora: PRINTER_CONFIG.printerName || "Padrão",
      metodo: "QZ Tray (Silencioso)"
    };
  }
  return {
    status: "desconectado",
    impressora: null,
    metodo: "Navegador (com preview)"
  };
}

// Tentar conectar ao iniciar
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    loadBackendPrinterConfig();
    initQzTray().then(conectado => {
      if (conectado) {
        console.log("🖨️ Sistema de impressão silenciosa ativo");
      } else {
        console.log("🖨️ Usando impressão padrão do navegador");
      }
    });
  }, 1000);
});

window.refreshPrinterConfig = loadBackendPrinterConfig;
